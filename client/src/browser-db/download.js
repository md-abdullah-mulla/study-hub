/**
 * Client-side file download.
 *
 * Needed in browser mode because there is no server that could answer a direct
 * link (`<a href="/api/export/backup">`); the browser already has the data, so
 * it builds the file itself. The Settings page therefore exports through this
 * helper and not through a plain anchor.
 */
export function saveAsFile(filename, contents, mimeType = 'text/plain') {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Fetches an export endpoint and saves the response as a file. */
export async function downloadFromApi(filename, apiPath) {
  const response = await fetch(apiPath);
  if (!response.ok) throw new Error(`Export failed (${response.status})`);
  const text = await response.text();
  const mime = response.headers.get('content-type') ?? 'text/plain';
  saveAsFile(filename, text, mime.split(';')[0]);
}
