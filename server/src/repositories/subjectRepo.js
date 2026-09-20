import { db } from '../db/connection.js';
import { camel, camelAll, withBooleans, mergeDefined } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

const BOOLS = ['isArchived'];

export const subjectRepo = {
  listByUser(userId, { includeArchived = false } = {}) {
    const rows = db
      .prepare(
        `SELECT * FROM subjects
         WHERE user_id = ? ${includeArchived ? '' : 'AND is_archived = 0'}
         ORDER BY order_index, id`
      )
      .all(userId);
    return rows.map((r) => withBooleans(r, BOOLS));
  },

  findById(id) {
    return withBooleans(db.prepare('SELECT * FROM subjects WHERE id = ?').get(id), BOOLS);
  },

  findByName(userId, name) {
    return camel(
      db
        .prepare('SELECT * FROM subjects WHERE user_id = ? AND lower(name) = lower(?)')
        .get(userId, name)
    );
  },

  nextOrderIndex(userId) {
    const row = db
      .prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM subjects WHERE user_id = ?')
      .get(userId);
    return row.next;
  },

  create(data) {
    const now = nowIso();
    const info = db
      .prepare(
        `INSERT INTO subjects
           (user_id, name, name_bn, code, color, icon, order_index, is_archived, created_at, updated_at)
         VALUES (@userId, @name, @nameBn, @code, @color, @icon, @orderIndex, 0, @now, @now)`
      )
      .run({
        userId: data.userId,
        name: data.name,
        nameBn: data.nameBn ?? null,
        code: data.code ?? null,
        color: data.color ?? '#2563eb',
        icon: data.icon ?? 'book',
        orderIndex: data.orderIndex ?? subjectRepo.nextOrderIndex(data.userId),
        now,
      });
    return subjectRepo.findById(info.lastInsertRowid);
  },

  update(id, data) {
    const current = subjectRepo.findById(id);
    if (!current) return null;
    const merged = mergeDefined(current, data);
    db.prepare(
      `UPDATE subjects SET
         name = @name, name_bn = @nameBn, code = @code, color = @color,
         icon = @icon, order_index = @orderIndex, is_archived = @isArchived, updated_at = @updatedAt
       WHERE id = @id`
    ).run({
      id,
      name: merged.name,
      nameBn: merged.nameBn ?? null,
      code: merged.code ?? null,
      color: merged.color,
      icon: merged.icon,
      orderIndex: merged.orderIndex,
      isArchived: merged.isArchived ? 1 : 0,
      updatedAt: nowIso(),
    });
    return subjectRepo.findById(id);
  },

  /** hard delete -> chapters/topics are removed by ON DELETE CASCADE */
  remove(id) {
    return db.prepare('DELETE FROM subjects WHERE id = ?').run(id).changes > 0;
  },

  rowsForOwner(id) {
    return camel(db.prepare('SELECT id, user_id FROM subjects WHERE id = ?').get(id));
  },
};

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
