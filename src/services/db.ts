import Database from '@tauri-apps/plugin-sql';
import type { OutlineContent, OutlineRecord } from '@/types/outline';

const DB_URL = 'sqlite:outline.db';
let dbPromise: Promise<Database> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = Database.load(DB_URL);
  }
  return dbPromise;
}

interface OutlineRow {
  id: number;
  title: string;
  source_type: 'text' | 'file';
  source_name: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: OutlineRow): OutlineRecord {
  return {
    id: row.id,
    title: row.title,
    source_type: row.source_type,
    source_name: row.source_name,
    content: JSON.parse(row.content) as OutlineContent,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listOutlines(): Promise<OutlineRecord[]> {
  const db = await getDb();
  const rows = await db.select<OutlineRow[]>(
    'SELECT id, title, source_type, source_name, content, created_at, updated_at FROM outlines ORDER BY updated_at DESC'
  );
  return rows.map(mapRow);
}

export async function getOutline(id: number): Promise<OutlineRecord> {
  const db = await getDb();
  const rows = await db.select<OutlineRow[]>(
    'SELECT id, title, source_type, source_name, content, created_at, updated_at FROM outlines WHERE id = ?',
    [id]
  );
  const row = rows[0];
  if (!row) {
    throw new Error('提纲不存在');
  }
  return mapRow(row);
}

export async function saveOutline(input: {
  id?: number;
  title: string;
  sourceType: 'text' | 'file';
  sourceName?: string | null;
  content: OutlineContent;
}): Promise<OutlineRecord> {
  const db = await getDb();
  const now = new Date().toISOString();
  const content = JSON.stringify(input.content);

  if (input.id) {
    await db.execute(
      'UPDATE outlines SET title = ?, source_type = ?, source_name = ?, content = ?, updated_at = ? WHERE id = ?',
      [
        input.title,
        input.sourceType,
        input.sourceName ?? null,
        content,
        now,
        input.id,
      ]
    );
    return getOutline(input.id);
  }

  const result = await db.execute(
    'INSERT INTO outlines (title, source_type, source_name, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [
      input.title,
      input.sourceType,
      input.sourceName ?? null,
      content,
      now,
      now,
    ]
  );
  const insertedId = result.lastInsertId;
  if (!insertedId) {
    throw new Error('保存失败');
  }
  return getOutline(Number(insertedId));
}

export async function deleteOutline(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM outlines WHERE id = ?', [id]);
}
