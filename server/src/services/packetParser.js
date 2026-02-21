const ETH_HEADER_LEN = 14;
const MIN_IP_HEADER_LEN = 20;
const MIN_TCP_HEADER_LEN = 20;
const PROTOCOL_TCP = 6;
const PROTOCOL_UDP = 17;
const ETHERTYPE_IPV4 = 0x0800;

function ntohs(buf, offset = 0) {
  return buf.readUInt16BE(offset);
}

function ipToString(buf, offset = 0) {
  return `${buf[offset]}.${buf[offset + 1]}.${buf[offset + 2]}.${buf[offset + 3]}`;
}

export function parsePacket(rawData, tsSec, tsUsec) {
  if (!Buffer.isBuffer(rawData) || rawData.length < ETH_HEADER_LEN + MIN_IP_HEADER_LEN) return null;
  const result = { tsSec, tsUsec, srcIp: null, dstIp: null, srcPort: null, dstPort: null, protocol: null, payloadOffset: 0, payloadLength: 0, payload: null, destPort: null };
  let offset = 0;
  const etherType = ntohs(rawData, 12);
  if (etherType !== ETHERTYPE_IPV4) return null;
  offset = ETH_HEADER_LEN;
  const versionIhl = rawData[offset];
  const ihl = (versionIhl & 0x0f) * 4;
  if (ihl < MIN_IP_HEADER_LEN || rawData.length < offset + ihl) return null;
  result.protocol = rawData[offset + 9];
  result.srcIp = ipToString(rawData, offset + 12);
  result.dstIp = ipToString(rawData, offset + 16);
  offset += ihl;
  if (result.protocol === PROTOCOL_TCP) {
    if (rawData.length < offset + MIN_TCP_HEADER_LEN) return null;
    result.srcPort = ntohs(rawData, offset);
    result.dstPort = ntohs(rawData, offset + 2);
    const dataOffset = (rawData[offset + 12] >> 4) * 4;
    result.payloadOffset = offset + dataOffset;
    result.payloadLength = rawData.length - result.payloadOffset;
    result.payload = result.payloadLength > 0 ? rawData.subarray(result.payloadOffset) : null;
  } else if (result.protocol === PROTOCOL_UDP) {
    result.srcPort = ntohs(rawData, offset);
    result.dstPort = ntohs(rawData, offset + 2);
    result.payloadOffset = offset + 8;
    result.payloadLength = rawData.length - result.payloadOffset;
    result.payload = result.payloadLength > 0 ? rawData.subarray(result.payloadOffset) : null;
  }
  return result;
}

export function fiveTupleKey(parsed) {
  return `${parsed.srcIp}:${parsed.srcPort}-${parsed.dstIp}:${parsed.dstPort}-${parsed.protocol}`;
}
