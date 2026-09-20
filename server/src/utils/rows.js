/** snake_case DB row -> camelCase JS object (name_bn -> nameBn) */
export function camel(row) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())] = value;
  }
  return out;
}

export function camelAll(rows) {
  return rows.map(camel);
}

/** SQLite stores booleans as 0/1 — convert the columns we care about. */
export function withBooleans(row, keys = []) {
  const out = camel(row);
  for (const key of keys) if (key in out) out[key] = Boolean(out[key]);
  return out;
}
