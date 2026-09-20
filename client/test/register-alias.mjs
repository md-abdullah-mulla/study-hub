// Registers the resolution hook above for `node --import ./test/register-alias.mjs`.
import { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

register('./alias-loader.mjs', import.meta.url);

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
