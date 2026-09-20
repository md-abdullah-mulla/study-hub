/**
 * Byte helpers that work both in Node and in the browser.
 *
 * Why not `Buffer.byteLength`? The whole backend is also bundled into the
 * browser build (the app can run fully offline on SQLite/WASM, no server), and
 * `Buffer` simply does not exist there — calling it threw
 * "ReferenceError: Buffer is not defined" and killed the backup feature on the
 * deployed site. `TextEncoder` is a standard global in Node and in every
 * modern browser, so one implementation covers both runtimes.
 */
const encoder = new TextEncoder();

/** UTF-8 byte length of a string (0 for null/undefined). */
export function byteLength(text) {
  if (!text) return 0;
  return encoder.encode(String(text)).length;
}
