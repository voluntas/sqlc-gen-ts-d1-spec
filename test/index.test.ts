import * as db from '../src/gen/sqlc/querier'

import { expect, test } from 'vitest'
const describe = setupMiniflareIsolatedStorage()
const { D1_TEST } = getMiniflareBindings()

import { createSQLiteDB } from '@miniflare/shared'
import { D1Database, D1DatabaseAPI } from '@miniflare/d1'

test('test 1', async () => {
  const sqliteDb = await createSQLiteDB(':memory:')
  const D1 = new D1Database(new D1DatabaseAPI(sqliteDb))
  // q: 指定した SQL ファイルを db/schema.sql から読み込みたい
  //   await D1.exec(`CREATE TABLE org (
  //   pk INTEGER PRIMARY KEY AUTOINCREMENT,
  //   id TEXT UNIQUE NOT NULL,
  //   display_name TEXT NOT NULL
  // );
  //
  // CREATE TABLE account (
  //   pk INTEGER PRIMARY KEY AUTOINCREMENT,
  //   id TEXT UNIQUE NOT NULL,
  //   display_name TEXT NOT NULL,
  //   email TEXT
  // );
  //
  // CREATE TABLE org_account (
  //   org_pk INTEGER NOT NULL,
  //   account_pk INTEGER NOT NULL,
  //   PRIMARY KEY (org_pk, account_pk),
  //   FOREIGN KEY (org_pk) REFERENCES org (pk) ON DELETE CASCADE ON UPDATE CASCADE,
  //   FOREIGN KEY (account_pk) REFERENCES account (pk) ON DELETE CASCADE ON UPDATE CASCADE
  // );
  //
  // CREATE TABLE account_log (
  //   pk INTEGER PRIMARY KEY AUTOINCREMENT,
  //   tag TEXT NOT NULL,
  //   time TEXT DEFAULT CURRENT_TIMESTAMP,
  //   -- JSON 型は非対応
  //   -- data JSON NOT NULL
  //   data TEXT NOT NULL
  // )`)
})
