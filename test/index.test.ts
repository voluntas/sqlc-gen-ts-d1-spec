import { D1Database } from '@cloudflare/workers-types/2022-11-30'
import * as db from '../src/gen/sqlc/querier'

import { expect, test } from 'vitest'
// const describe = setupMiniflareIsolatedStorage()
// const { D1_TEST } = getMiniflareBindings()

import { createSQLiteDB } from '@miniflare/shared'
import { D1Database as miniflareD1Database, D1DatabaseAPI } from '@miniflare/d1'

test('test 1', async () => {
  const sqliteDb = await createSQLiteDB(':memory:')
  // sqlc で生成したコードを使いたいが D1Database の型がマッチしない問題がある
  // miniflare が定義している D1Database と
  // @cloudflare/workers-types/2022 - 11 - 30 が定義している D1Database の型が異なる
  // そのためそもそも D1 を渡そうとするとエラーになる
  // なので D1Database 型に無理矢理変換している
  const D1 = new miniflareD1Database(new D1DatabaseAPI(sqliteDb)) as D1Database

  // TODO: ここは本来 db/schema.sql ファイル読み込むようにする
  await D1.exec(
    `CREATE TABLE account (pk INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, email TEXT);`,
  )

  const r = await db.createAccount(D1, { id: 'test', displayName: 'test', email: null })
  console.log(r)
})
