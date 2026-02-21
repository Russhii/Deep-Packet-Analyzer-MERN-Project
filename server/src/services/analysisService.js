import fs from 'fs';
import path from 'path';
import pcap from 'pcap-parser';
import { parsePacket, fiveTupleKey } from './packetParser.js';
import { extractSNI } from './sniExtractor.js';
import { sniToAppType } from './appType.js';
import Capture from '../models/Capture.js';
import Flow from '../models/Flow.js';
import AnalysisReport from '../models/AnalysisReport.js';
import Rule from '../models/Rule.js';

const PROTOCOL_TCP = 6;
const PROTOCOL_UDP = 17;

async function getActiveRules() {
  const rules = await Rule.find({ enabled: true }).lean();
  const blockedIps = new Set();
  const blockedApps = new Set();
  const blockedDomains = [];
  for (const r of rules) {
    if (r.type === 'ip') blockedIps.add(r.value.trim());
    if (r.type === 'app') blockedApps.add(r.value.toUpperCase().replace(/\s+/g, '_'));
    if (r.type === 'domain') blockedDomains.push(r.value.toLowerCase().trim());
  }
  return { blockedIps, blockedApps, blockedDomains };
}

function isBlocked(srcIp, appType, sni, rules) {
  if (rules.blockedIps.has(srcIp)) return true;
  if (rules.blockedApps.has(appType)) return true;
  if (sni) {
    const lower = sni.toLowerCase();
    for (const dom of rules.blockedDomains) {
      if (lower.includes(dom)) return true;
    }
  }
  return false;
}

export async function runAnalysis(captureId, filePath) {
  const start = Date.now();
  const capture = await Capture.findById(captureId);
  if (!capture) throw new Error('Capture not found');
  await Capture.findByIdAndUpdate(captureId, { status: 'analyzing' });
  await Flow.deleteMany({ captureId });
  await AnalysisReport.deleteMany({ captureId });

  const flows = new Map();
  const appCounts = {};
  const detectedDomains = new Map();
  let totalPackets = 0;
  let totalBytes = 0;
  let forwarded = 0;
  let dropped = 0;
  let tcpPackets = 0;
  let udpPackets = 0;

  const rules = await getActiveRules();

  return new Promise((resolve, reject) => {
    const parser = pcap.parse(filePath);
    parser.on('packet', (packet) => {
      const raw = Buffer.isBuffer(packet.data) ? packet.data : Buffer.from(packet.data);
      const header = packet.header || {};
      const tsSec = header.timestampSeconds ?? 0;
      const tsUsec = header.timestampMicroseconds ?? 0;
      const parsed = parsePacket(raw, tsSec, tsUsec);
      if (!parsed || (!parsed.srcIp && !parsed.dstIp)) return;

      totalPackets++;
      totalBytes += raw.length;
      if (parsed.protocol === PROTOCOL_TCP) tcpPackets++;
      else if (parsed.protocol === PROTOCOL_UDP) udpPackets++;

      const key = fiveTupleKey(parsed);
      let flow = flows.get(key);
      if (!flow) {
        flow = {
          key,
          fiveTuple: { srcIp: parsed.srcIp, dstIp: parsed.dstIp, srcPort: parsed.srcPort, dstPort: parsed.dstPort, protocol: parsed.protocol },
          appType: 'UNKNOWN',
          sni: null,
          packetsIn: 0,
          packetsOut: 0,
          bytesIn: 0,
          bytesOut: 0,
          blocked: false,
          firstSeen: new Date(tsSec * 1000),
          lastSeen: new Date(tsSec * 1000),
        };
        flows.set(key, flow);
      }

      flow.packetsIn++;
      flow.bytesIn += raw.length;
      flow.lastSeen = new Date(tsSec * 1000);

      if (parsed.dstPort === 443 && parsed.payload && parsed.payload.length > 5) {
        const sni = extractSNI(parsed.payload);
        if (sni) {
          flow.sni = sni;
          flow.appType = sniToAppType(sni);
          appCounts[flow.appType] = (appCounts[flow.appType] || 0) + 1;
          if (!detectedDomains.has(sni)) detectedDomains.set(sni, flow.appType);
        }
      } else if (parsed.dstPort === 80) {
        flow.appType = 'HTTP';
        appCounts.HTTP = (appCounts.HTTP || 0) + 1;
      } else if (parsed.dstPort === 53 || parsed.srcPort === 53) {
        flow.appType = 'DNS';
        appCounts.DNS = (appCounts.DNS || 0) + 1;
      } else {
        appCounts.UNKNOWN = (appCounts.UNKNOWN || 0) + 1;
      }

      if (!flow.blocked && flow.appType !== 'UNKNOWN') {
        flow.blocked = isBlocked(parsed.srcIp, flow.appType, flow.sni, rules);
      }
      if (flow.blocked) dropped++;
      else forwarded++;
    });

    parser.on('end', async () => {
      try {
        const flowDocs = Array.from(flows.values()).map((f) => ({
          captureId,
          fiveTuple: f.fiveTuple,
          appType: f.appType,
          sni: f.sni,
          packetsIn: f.packetsIn,
          packetsOut: f.packetsOut,
          bytesIn: f.bytesIn,
          bytesOut: f.bytesOut,
          blocked: f.blocked,
          firstSeen: f.firstSeen,
          lastSeen: f.lastSeen,
        }));
        await Flow.insertMany(flowDocs);

        const appBreakdown = Object.entries(appCounts).map(([appType, count]) => ({
          appType,
          count,
          percentage: totalPackets ? Math.round((count / totalPackets) * 1000) / 10 : 0,
        })).sort((a, b) => b.count - a.count);

        const report = new AnalysisReport({
          captureId,
          totalPackets,
          totalBytes,
          forwarded,
          dropped,
          tcpPackets,
          udpPackets,
          appBreakdown,
          detectedDomains: Array.from(detectedDomains.entries()).map(([sni, appType]) => ({ sni, appType })),
          durationMs: Date.now() - start,
        });
        await report.save();

        await Capture.findByIdAndUpdate(captureId, {
          status: 'done',
          packetCount: totalPackets,
        });
        resolve({ report, flows: flowDocs.length });
      } catch (err) {
        await Capture.findByIdAndUpdate(captureId, { status: 'error', errorMessage: err.message });
        reject(err);
      }
    });

    parser.on('error', async (err) => {
      await Capture.findByIdAndUpdate(captureId, { status: 'error', errorMessage: err.message });
      reject(err);
    });
  });
}
