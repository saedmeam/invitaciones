const fs = require('fs');
const path = require('path');

function getPngDimensions(buf) {
  if (buf.length >= 24 && buf.toString('ascii', 1, 4) === 'PNG') {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  return null;
}

function getJpegDimensions(buf) {
  let i = 0;
  if (buf[i] !== 0xFF || buf[i + 1] !== 0xD8) return null;
  i += 2;
  while (i < buf.length) {
    if (buf[i] !== 0xFF) return null;
    const marker = buf[i + 1];
    if (marker === 0xC0 || marker === 0xC2) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

const dir = 'backend/uploads/assets';
const files = fs.readdirSync(dir);
for (const f of files) {
  const p = path.join(dir, f);
  const buf = fs.readFileSync(p);
  const dims = f.endsWith('.png') ? getPngDimensions(buf) : getJpegDimensions(buf);
  console.log(f, 'size:', buf.length, 'dims:', dims);
}
