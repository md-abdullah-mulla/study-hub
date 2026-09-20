import { db } from '../db/connection.js';
import { camel, camelAll, mergeDefined } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

export const chapterRepo = {
  listBySubject(subjectId) {
    return camelAll(
      db
        .prepare('SELECT * FROM chapters WHERE subject_id = ? ORDER BY order_index, number, id')
        .all(subjectId)
    );
  },

  findById(id) {
    return camel(db.prepare('SELECT * FROM chapters WHERE id = ?').get(id));
  },

  findByName(subjectId, name) {
    return camel(
      db
        .prepare('SELECT * FROM chapters WHERE subject_id = ? AND lower(name) = lower(?)')
        .get(subjectId, name)
    );
  },

  nextOrderIndex(subjectId) {
    const row = db
      .prepare(
        'SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM chapters WHERE subject_id = ?'
      )
      .get(subjectId);
    return row.next;
  },

  nextNumber(subjectId) {
    const row = db
      .prepare('SELECT COALESCE(MAX(number), 0) + 1 AS next FROM chapters WHERE subject_id = ?')
      .get(subjectId);
    return row.next;
  },

  create(data) {
    const now = nowIso();
    const info = db
      .prepare(
        `INSERT INTO chapters
           (subject_id, number, name, name_bn, notes, order_index, created_at, updated_at)
         VALUES (@subjectId, @number, @name, @nameBn, @notes, @orderIndex, @now, @now)`
      )
      .run({
        subjectId: data.subjectId,
        number: data.number ?? chapterRepo.nextNumber(data.subjectId),
        name: data.name,
        nameBn: data.nameBn ?? null,
        notes: data.notes ?? null,
        orderIndex: data.orderIndex ?? chapterRepo.nextOrderIndex(data.subjectId),
        now,
      });
    return chapterRepo.findById(info.lastInsertRowid);
  },

  update(id, data) {
    const current = chapterRepo.findById(id);
    if (!current) return null;
    const merged = mergeDefined(current, data);
    db.prepare(
      `UPDATE chapters SET number = @number, name = @name, name_bn = @nameBn,
         notes = @notes, order_index = @orderIndex, updated_at = @updatedAt
       WHERE id = @id`
    ).run({
      id,
      number: merged.number,
      name: merged.name,
      nameBn: merged.nameBn ?? null,
      notes: merged.notes ?? null,
      orderIndex: merged.orderIndex,
      updatedAt: nowIso(),
    });
    return chapterRepo.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM chapters WHERE id = ?').run(id).changes > 0;
  },
};
