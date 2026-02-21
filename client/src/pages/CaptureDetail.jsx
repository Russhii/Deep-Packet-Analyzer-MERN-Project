import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API = '/api';

export default function CaptureDetail() {
  const { id } = useParams();
  const [capture, setCapture] = useState(null);
  const [report, setReport] = useState(null);
  const [flows, setFlows] = useState([]);
  const [tab, setTab] = useState('report');

  useEffect(() => {
    fetch(`${API}/captures/${id}`)
      .then((r) => r.json())
      .then(setCapture)
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    fetch(`${API}/analysis/report/${id}`)
      .then((r) => r.json())
      .then(setReport)
      .catch(() => setReport(null));
    fetch(`${API}/analysis/flows/${id}`)
      .then((r) => r.json())
      .then(setFlows)
      .catch(() => setFlows([]));
  }, [id]);

  if (!capture) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}>← Captures</Link>
      </div>
      <h1 style={h1}>{capture.originalName}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Status: {capture.status} · {(capture.size / 1024).toFixed(1)} KB
      </p>
      <div style={tabs}>
        <button style={{ ...tabBtn, ...(tab === 'report' ? tabBtnActive : {}) }} onClick={() => setTab('report')}>Report</button>
        <button style={{ ...tabBtn, ...(tab === 'flows' ? tabBtnActive : {}) }} onClick={() => setTab('flows')}>Flows</button>
      </div>
      {tab === 'report' && (
        <div style={card}>
          {report ? (
            <>
              <h2 style={h2}>Summary</h2>
              <div style={grid}>
                <div style={statBox}>Total packets: <strong>{report.totalPackets}</strong></div>
                <div style={statBox}>Total bytes: <strong>{(report.totalBytes / 1024).toFixed(1)} KB</strong></div>
                <div style={statBox}>Forwarded: <strong style={{ color: 'var(--success)' }}>{report.forwarded}</strong></div>
                <div style={statBox}>Dropped: <strong style={{ color: 'var(--danger)' }}>{report.dropped}</strong></div>
                <div style={statBox}>TCP: {report.tcpPackets} · UDP: {report.udpPackets}</div>
                <div style={statBox}>Duration: {report.durationMs} ms</div>
              </div>
              <h2 style={h2}>Application breakdown</h2>
              <div style={list}>
                {report.appBreakdown?.map((a) => (
                  <div key={a.appType} style={listRow}>
                    <span>{a.appType}</span>
                    <span>{a.count} ({a.percentage}%)</span>
                  </div>
                ))}
              </div>
              <h2 style={h2}>Detected domains (SNI)</h2>
              <div style={list}>
                {report.detectedDomains?.slice(0, 30).map((d, i) => (
                  <div key={i} style={listRow}>
                    <span className="mono">{d.sni}</span>
                    <span>{d.appType}</span>
                  </div>
                ))}
                {report.detectedDomains?.length > 30 && <p style={{ color: 'var(--text-muted)' }}>… and {report.detectedDomains.length - 30} more</p>}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No report yet. Run analysis from the Captures list.</p>
          )}
        </div>
      )}
      {tab === 'flows' && (
        <div style={card}>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Source → Dest</th>
                  <th style={th}>App</th>
                  <th style={th}>SNI</th>
                  <th style={th}>Packets</th>
                  <th style={th}>Blocked</th>
                </tr>
              </thead>
              <tbody>
                {flows.map((f) => (
                  <tr key={f._id}>
                    <td style={td} className="mono">
                      {f.fiveTuple?.srcIp}:{f.fiveTuple?.srcPort} → {f.fiveTuple?.dstIp}:{f.fiveTuple?.dstPort}
                    </td>
                    <td style={td}>{f.appType}</td>
                    <td style={td} className="mono">{f.sni || '—'}</td>
                    <td style={td}>{f.packetsIn}</td>
                    <td style={td}>{f.blocked ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {flows.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No flows. Run analysis first.</p>}
        </div>
      )}
    </div>
  );
}

const h1 = { marginBottom: '0.25rem', fontWeight: 600 };
const h2 = { fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem' };
const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem' };
const tabs = { display: 'flex', gap: '0.5rem', marginBottom: '1rem' };
const tabBtn = { padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' };
const tabBtnActive = { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' };
const statBox = { padding: '0.75rem', background: 'var(--bg)', borderRadius: 6, fontSize: '0.9rem' };
const list = { marginTop: '0.5rem' };
const listRow = { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' };
const tableWrap = { overflow: 'auto' };
const table = { width: '100%', borderCollapse: 'collapse' };
const th = { textAlign: 'left', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' };
const td = { padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' };
