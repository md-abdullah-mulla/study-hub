import { db } from '../db/connection.js';
import { camel } from '../utils/rows.js';

/** The student profile. One row today (single-user app), but nothing assumes it. */
export const userRepo = {
  findById(id) {
    return camel(db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id));
  },

  /** Used by the printable report header and the Settings page. */
  updateName(id, name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, id);
    return userRepo.findById(id);
  },
};
