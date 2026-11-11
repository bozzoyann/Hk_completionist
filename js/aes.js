/*
 * Minimal AES (128/192/256) ECB decryption, no dependencies.
 * Only decryption is needed to read Hollow Knight save files.
 */
(function (global) {
  "use strict";

  // Build S-box / inverse S-box and multiplication helpers.
  const SBOX = new Uint8Array(256);
  const INV_SBOX = new Uint8Array(256);
  (function init() {
    let p = 1, q = 1;
    do {
      // multiply p by 3
      p = p ^ ((p << 1) & 0xff) ^ (p & 0x80 ? 0x1b : 0);
      // divide q by 3
      q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff;
      if (q & 0x80) q ^= 0x09;
      const x = q ^ ((q << 1) | (q >> 7)) ^ ((q << 2) | (q >> 6)) ^
        ((q << 3) | (q >> 5)) ^ ((q << 4) | (q >> 4));
      const s = (x ^ 0x63) & 0xff;
      SBOX[p] = s;
      INV_SBOX[s] = p;
    } while (p !== 1);
    SBOX[0] = 0x63;
    INV_SBOX[0x63] = 0;
  })();

  function xtime(a) { return ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff; }
  function mul(a, b) {
    let r = 0;
    while (b) { if (b & 1) r ^= a; a = xtime(a); b >>= 1; }
    return r;
  }

  function expandKey(key) {
    const nk = key.length / 4;
    if (![4, 6, 8].includes(nk)) throw new Error("Invalid AES key length");
    const nr = nk + 6;
    const w = new Uint8Array(16 * (nr + 1));
    w.set(key);
    let rcon = 1;
    for (let i = nk; i < 4 * (nr + 1); i++) {
      let t = w.slice((i - 1) * 4, i * 4);
      if (i % nk === 0) {
        t = Uint8Array.of(SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]);
        rcon = xtime(rcon);
      } else if (nk > 6 && i % nk === 4) {
        t = t.map((b) => SBOX[b]);
      }
      for (let j = 0; j < 4; j++) w[i * 4 + j] = w[(i - nk) * 4 + j] ^ t[j];
    }
    return { w, nr };
  }

  function decryptBlock(s, ks) {
    const { w, nr } = ks;
    const addRoundKey = (r) => { for (let i = 0; i < 16; i++) s[i] ^= w[r * 16 + i]; };
    addRoundKey(nr);
    for (let round = nr - 1; round >= 0; round--) {
      // inverse shift rows (state is column-major: s[c*4 + r])
      let t = s[13]; s[13] = s[9]; s[9] = s[5]; s[5] = s[1]; s[1] = t;
      t = s[2]; s[2] = s[10]; s[10] = t; t = s[6]; s[6] = s[14]; s[14] = t;
      t = s[3]; s[3] = s[7]; s[7] = s[11]; s[11] = s[15]; s[15] = t;
      for (let i = 0; i < 16; i++) s[i] = INV_SBOX[s[i]];
      addRoundKey(round);
      if (round > 0) {
        for (let c = 0; c < 4; c++) {
          const a0 = s[c * 4], a1 = s[c * 4 + 1], a2 = s[c * 4 + 2], a3 = s[c * 4 + 3];
          s[c * 4] = mul(a0, 14) ^ mul(a1, 11) ^ mul(a2, 13) ^ mul(a3, 9);
          s[c * 4 + 1] = mul(a0, 9) ^ mul(a1, 14) ^ mul(a2, 11) ^ mul(a3, 13);
          s[c * 4 + 2] = mul(a0, 13) ^ mul(a1, 9) ^ mul(a2, 14) ^ mul(a3, 11);
          s[c * 4 + 3] = mul(a0, 11) ^ mul(a1, 13) ^ mul(a2, 9) ^ mul(a3, 14);
        }
      }
    }
  }

  /** Decrypt data (Uint8Array, multiple of 16 bytes) with AES-ECB. */
  function decryptECB(data, key) {
    if (data.length % 16 !== 0) throw new Error("Encrypted data is not a multiple of 16 bytes");
    const ks = expandKey(key);
    const out = new Uint8Array(data);
    for (let off = 0; off < out.length; off += 16) {
      decryptBlock(out.subarray(off, off + 16), ks);
    }
    return out;
  }

  global.AES = { decryptECB };
})(typeof window !== "undefined" ? window : globalThis);
