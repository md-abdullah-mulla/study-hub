import { createApp } from './app.js';
import { bootstrapDatabase } from './db/nodeBootstrap.js';
import { config } from './config.js';

const info = bootstrapDatabase();
const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[study-hub] API ready on http://localhost:${config.port}`);
  console.log(`[study-hub] database: ${info.dbFile} (schema v${info.schemaVersion})`);
});
