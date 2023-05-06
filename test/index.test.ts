import * as db from '../src/gen/sqlc/querier'

import { expect, test } from 'vitest'
const describe = setupMiniflareIsolatedStorage()
const { D1_TEST } = getMiniflareBindings()

import { createSQLiteDB } from '@miniflare/shared'
import { D1Database, D1DatabaseAPI } from '@miniflare/d1'

test('test 1', async () => {
  const sqliteDb = await createSQLiteDB(':memory:')
  const D1 = new D1Database(new D1DatabaseAPI(sqliteDb))
  // TODO: ここは本来ファイル読み込みにする
  await D1.exec(
    `CREATE TABLE account_log ( pk INTEGER PRIMARY KEY AUTOINCREMENT, tag TEXT NOT NULL, time TEXT DEFAULT CURRENT_TIMESTAMP, data TEXT NOT NULL);`,
  )
  await D1.prepare(`INSERT INTO account_log (tag, data) VALUES (?, ?);`)
    .bind('test', JSON.stringify({ a: 'b' }))
    .run()

  const result = await D1.prepare(`SELECT * FROM account_log;`).all()
  console.log(result)
})
