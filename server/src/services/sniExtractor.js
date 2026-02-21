const CONTENT_TYPE_HANDSHAKE = 0x16;
const HANDSHAKE_CLIENT_HELLO = 0x01;
const EXTENSION_SNI = 0x0000;
const SNI_TYPE_HOSTNAME = 0x00;

function readUint16BE(buf, offset = 0) {
  return buf.readUInt16BE(offset);
}

function readUint24BE(buf, offset = 0) {
  return (buf[offset] << 16) | (buf[offset + 1] << 8) | buf[offset + 2];
}

export function isTLSClientHello(payload) {
  if (!Buffer.isBuffer(payload) || payload.length < 9) return false;
  if (payload[0] !== CONTENT_TYPE_HANDSHAKE) return false;
  const version = readUint16BE(payload, 1);
  if (version < 0x0300 || version > 0x0304) return false;
  const recordLength = readUint16BE(payload, 3);
  if (recordLength > payload.length - 5) return false;
  if (payload[5] !== HANDSHAKE_CLIENT_HELLO) return false;
  return true;
}

export function extractSNI(payload) {
  if (!isTLSClientHello(payload)) return null;
  let offset = 5;
  const handshakeLength = readUint24BE(payload, offset + 1);
  offset += 4;
  offset += 2; // client version
  offset += 32; // random
  if (offset >= payload.length) return null;
  const sessionIdLength = payload[offset];
  offset += 1 + sessionIdLength;
  if (offset + 2 > payload.length) return null;
  const cipherSuitesLength = readUint16BE(payload, offset);
  offset += 2 + cipherSuitesLength;
  if (offset >= payload.length) return null;
  const compressionMethodsLength = payload[offset];
  offset += 1 + compressionMethodsLength;
  if (offset + 2 > payload.length) return null;
  const extensionsLength = readUint16BE(payload, offset);
  offset += 2;
  const extensionsEnd = Math.min(offset + extensionsLength, payload.length);
  while (offset + 4 <= extensionsEnd) {
    const extensionType = readUint16BE(payload, offset);
    const extensionLength = readUint16BE(payload, offset + 2);
    offset += 4;
    if (offset + extensionLength > extensionsEnd) break;
    if (extensionType === EXTENSION_SNI && extensionLength >= 5) {
      const sniListLength = readUint16BE(payload, offset);
      if (sniListLength < 3) break;
      const sniType = payload[offset + 2];
      const sniLength = readUint16BE(payload, offset + 3);
      if (sniType !== SNI_TYPE_HOSTNAME || sniLength > extensionLength - 5) break;
      return payload.subarray(offset + 5, offset + 5 + sniLength).toString('utf8');
    }
    offset += extensionLength;
  }
  return null;
}
