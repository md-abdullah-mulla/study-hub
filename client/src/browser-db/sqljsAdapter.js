/**
 * better-sqlite3–compatible wrapper around sql.js (SQLite compiled to WebAssembly).
 *
 * Why: the GitHub Pages build has no Node server, so the database runs inside
 * the browser. This adapter exposes exactly the API our repositories use
 * (`prepare().get() / .all() / .run()`, `exec()`, `transaction()`), which is why
 * no repository, service or route had to change.
 *
 * Two compatibility notes:
 *  - sql.js does not bind named parameters (`@name`) reliably, so statements are
 *    compiled once: named/positional placeholders are rewritten to `?` and the
 *    values are bound in that order.
 *  - SQLite lives in memory here, so every write schedules a debounced
 *    `export()` → the caller persists the bytes (IndexedDB in the browser).
 */

/** Rewrites `@name` / `:name` / `$name` placeholders to `?` and records their order. */
export function compileSql(sql) {
  const names = [];
  let out = '';
  let index = 0;

  const readString = (quote) => {
    out += quote;
    index += 1;
    while (index < sql.length) {
      if (sql[index] === quote && sql[index + 1] === quote) {
        out += quote + quote;
        index += 2;
        continue;
      }
      if (sql[index] === quote) {
        out += quote;
        index += 1;
        break;
      }
      out += sql[index];
      index += 1;
    }
  };

  while (index < sql.length) {
    const ch = sql[index];

    if (ch === "'" || ch === '"') {
      readString(ch);
      continue;
    }
    if (ch === '-' && sql[index + 1] === '-') {
      while (index < sql.length && sql[index] !== '\n') out += sql[index++];
      continue;
    }
    if (ch === '/' && sql[index + 1] === '*') {
      while (index < sql.length && !(sql[index] === '*' && sql[index + 1] === '/')) out += sql[index++];
      out += '*/';
      index += 2;
      continue;
    }
    if ((ch === '@' || ch === ':' || ch === '$') && /[A-Za-z_]/.test(sql[index + 1] ?? '')) {
      let end = index + 1;
      while (end < sql.length && /[A-Za-z0-9_]/.test(sql[end])) end += 1;
      names.push(sql.slice(index + 1, end));
      out += '?';
      index = end;
      continue;
    }

    out += ch;
    index += 1;
  }

  return { sql: out, names, isNamed: names.length > 0 };
}

/** Normalises the many call styles used in the codebase into a positional array. */
function toPositionalValues(compiled, args) {
  if (!compiled.isNamed) {
    if (args.length === 1 && Array.isArray(args[0])) return args[0];
    return args;
  }
  const params = args[0] ?? {};
  return compiled.names.map((name) => {
    const value = params[name];
    return value === undefined ? null : value;
  });
}

/**
 * @param {object} options
 * @param {any} options.SQL   initialised sql.js module (`await initSqlJs(...)`)
 * @param {Uint8Array|null} options.data  previously persisted database bytes
 * @param {(bytes: Uint8Array) => void} options.onPersist  called after writes
 */
export function createSqlJsDatabase({ SQL, data = null, onPersist, persistDelayMs = 250 }) {
  // `let` because a backup restore swaps the whole database file at runtime
  let sqlite = data ? new SQL.Database(new Uint8Array(data)) : new SQL.Database();
  sqlite.run('PRAGMA foreign_keys = ON');

  const compiledCache = new Map();
  let pendingPersist = false;
  let timer = null;

  const compile = (sql) => {
    const cached = compiledCache.get(sql);
    if (cached) return cached;
    const compiled = compileSql(sql);
    compiledCache.set(sql, compiled);
    return compiled;
  };

  const persistNow = () => {
    if (!pendingPersist) return;
    pendingPersist = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    onPersist?.(sqlite.export());
  };

  const schedulePersist = () => {
    pendingPersist = true;
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      persistNow();
    }, persistDelayMs);
  };

  const lastInsertRowId = () => {
    const result = sqlite.exec('SELECT last_insert_rowid()');
    return result?.[0]?.values?.[0]?.[0] ?? 0;
  };

  function prepare(sql) {
    const compiled = compile(sql);

    return {
      run(...args) {
        const statement = sqlite.prepare(compiled.sql);
        try {
          const values = toPositionalValues(compiled, args);
          if (values.length) statement.bind(values);
          statement.step();
        } finally {
          statement.free();
        }
        const changes = sqlite.getRowsModified();
        const rowid = lastInsertRowId();
        if (changes) schedulePersist();
        return { changes, lastInsertRowid: rowid };
      },

      get(...args) {
        const statement = sqlite.prepare(compiled.sql);
        try {
          const values = toPositionalValues(compiled, args);
          if (values.length) statement.bind(values);
          if (!statement.step()) return undefined;
          return statement.getAsObject();
        } finally {
          statement.free();
        }
      },

      all(...args) {
        const statement = sqlite.prepare(compiled.sql);
        const rows = [];
        try {
          const values = toPositionalValues(compiled, args);
          if (values.length) statement.bind(values);
          while (statement.step()) rows.push(statement.getAsObject());
        } finally {
          statement.free();
        }
        return rows;
      },
    };
  }

  function exec(sql) {
    sqlite.exec(sql);
    schedulePersist();
  }

  /** better-sqlite3 style: db.transaction(fn) returns a callable wrapper. */
  function transaction(fn) {
    return (...args) => {
      sqlite.run('BEGIN');
      try {
        const result = fn(...args);
        sqlite.run('COMMIT');
        schedulePersist();
        return result;
      } catch (error) {
        sqlite.run('ROLLBACK');
        throw error;
      }
    };
  }

  return {
    prepare,
    exec,
    transaction,
    /** bytes of the whole database — used by backups and by IndexedDB persistence */
    export: () => sqlite.export(),
    /**
     * Replaces the whole database with saved bytes (used by "Restore backup").
     * The caller is expected to reload the page afterwards: every loaded module
     * still holds the old connection.
     */
    replaceWith(bytes) {
      const next = new SQL.Database(bytes);
      sqlite.close();
      sqlite = next;
      persistNow();
      return sqlite.export().length;
    },
    flush: persistNow,
    close: () => sqlite.close(),
  };
}
