/*
 * Hollow Knight save file decoder.
 *
 * PC saves (userN.dat) are a .NET BinaryFormatter-serialized string:
 *   22-byte fixed header | 7-bit encoded length | base64 text | 0x0B
 * The base64 text decodes to AES-256-ECB (PKCS7) encrypted JSON.
 * Some platforms (e.g. Switch exports, modded tools) give plain JSON:
 * that is accepted too.
 */
(function (global) {
  "use strict";

  const KEY = new TextEncoder().encode("UKu52ePUBwetZ9wNX88o54dnfKRu0T1l");
  const HEADER_LEN = 22;

  function base64ToBytes(str) {
    const bin = atob(str.replace(/\s+/g, ""));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function stripPkcs7(bytes) {
    const pad = bytes[bytes.length - 1];
    if (pad < 1 || pad > 16) return bytes;
    return bytes.subarray(0, bytes.length - pad);
  }

  function extractBase64(bytes) {
    // Skip BinaryFormatter header, then read the 7-bit encoded length prefix.
    let pos = HEADER_LEN, len = 0, shift = 0;
    for (let i = 0; i < 5; i++) {
      const b = bytes[pos++];
      len |= (b & 0x7f) << shift;
      shift += 7;
      if ((b & 0x80) === 0) break;
    }
    const slice = bytes.subarray(pos, Math.min(pos + len, bytes.length));
    return new TextDecoder("ascii").decode(slice);
  }

  function parseJsonLoose(text) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < 0) throw new Error("JSON introuvable");
    return JSON.parse(text.slice(start, end + 1));
  }

  /** Decode a save from raw file bytes. Returns the parsed JSON object. */
  function decodeSave(buffer) {
    const bytes = new Uint8Array(buffer);
    // Plain JSON?
    let i = 0;
    while (i < bytes.length && (bytes[i] === 0x20 || bytes[i] === 0x0a || bytes[i] === 0x0d || bytes[i] === 0x09 || bytes[i] === 0xef || bytes[i] === 0xbb || bytes[i] === 0xbf)) i++;
    if (bytes[i] === 0x7b /* { */) {
      return parseJsonLoose(new TextDecoder().decode(bytes));
    }

    let b64;
    if (bytes[0] === 0x00 && bytes[1] === 0x01) {
      b64 = extractBase64(bytes);
    } else {
      // Maybe the user gave the raw base64 text.
      b64 = new TextDecoder("ascii").decode(bytes);
    }
    const encrypted = base64ToBytes(b64.trim());
    const decrypted = stripPkcs7(AES.decryptECB(encrypted, KEY));
    return parseJsonLoose(new TextDecoder().decode(decrypted));
  }

  global.HKSave = { decodeSave };
})(typeof window !== "undefined" ? window : globalThis);
