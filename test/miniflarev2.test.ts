import type { D1Database } from "@cloudflare/workers-types/experimental";
import * as db from "../src/gen/sqlc/querier";

import { expect, test } from "vitest";

import {
  D1Database as miniflareD1Database,
  D1DatabaseAPI,
} from "@miniflare/d1";
// shared と d1 は miniflare v2 の遺産なので、そのうち使えなくなる
// miniflare v3 側テスト用のライブラリを用意してくれるまで焦らずまつしかない
import { createSQLiteDB } from "@miniflare/shared";

test("account", async () => {
  const sqliteDb = await createSQLiteDB(":memory:");
  // sqlc で生成したコードを使いたいが D1Database の型がマッチしない問題がある
  // miniflare が定義している miniflareD1Database と @cloudflare/workers-types が定義している D1Database の型が異なる
  // そのため D1 を渡そうとするとエラーになる
  // 解決策として @cloudflare/workers-types の D1Database 型に無理矢理変換している
  const d1 = new miniflareD1Database(new D1DatabaseAPI(sqliteDb)) as D1Database;

  // TODO: ここは本来 db/schema.sql ファイル読み込むようにする
  await d1.exec(
    "CREATE TABLE account (pk INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, email TEXT);",
  );

  const r1 = await db.createAccount(d1, {
    id: "test",
    displayName: "Test",
    email: "test@example.com",
  });
  expect(r1.success).toBe(true);

  const a1 = await db.getAccount(d1, { id: "test" });
  expect(a1).not.toBeNull();
  expect(a1?.displayName).toBe("Test");
  expect(a1?.email).toBe("test@example.com");

  const r2 = await db.listAccounts(d1);
  expect(r2.success).toBeTruthy();
  expect(r2.results).not.toBeUndefined();
  expect(r2.results?.length).toBe(1);
  expect(r2.results?.[0].displayName).toBe("Test");
  expect(r2.results?.[0].email).toBe("test@example.com");

  const a2 = await db.updateAccountDisplayName(d1, {
    id: "test",
    displayName: "Test2",
  });
  expect(a2).not.toBeNull();
  expect(a2?.displayName).toBe("Test2");

  // batch のテスト
  const r3 = await d1.batch([
    db.deleteAccount(d1, { id: "test" }).batch(),
    db
      .createAccount(d1, {
        id: "test",
        displayName: "Test",
        email: "test@example.com",
      })
      .batch(),
  ]);

  expect(r3[0].success).toBe(true);
  expect(r3[1].success).toBe(true);
});
