# Cloudflare D1 向けの sqlc plugin (Wasm) の仕様

## 概要

このリポジトリは Cloudflare D1 で sqlc で利用するための設計仕様を公開しています。

実際の実装である [orisano/sqlc\-gen\-ts\-d1](https://github.com/orisano/sqlc-gen-ts-d1) を利用したテストも用意しています。

## 自動生成されたコード

- https://github.com/voluntas/sqlc-gen-ts-d1-spec/blob/main/sqlc.json
- https://github.com/voluntas/sqlc-gen-ts-d1-spec/blob/main/src/gen/sqlc/querier.ts

## モチベーション

- sqlc は素晴らしいので、SQL を利用するならなんでも sqlc を使いたい
- Cloudflare D1 向けの sqlc が欲しい
- D1 は SQL をそのまま書くので避けたい
- D1 の SQLite3 ベースなので sqlc の SQLite3 がそのまま使えるはず
- sqlc の plugin 機能を使いたい
  - sqlc の plugin 機能は Wasm
  - Go で Wasm を出力したモノを使いたい
- sqlc TypeScript で SQLite3 版も欲しい
  - sqlite3 の Wasm が公式から提供されている
- Electron で SQLite3 を使うときにも使いたい
- sqlc と vitest でテストを書きたい

## TODO

- [x] Cloudflare Pages + Remix のサンプル
  - pages がちょっと融通が利かなすぎてツライので pages は諦めた
- Makefile で sqlc generate を実行する仕組み
- D1 が対応したら tx のテスト
- batch の仕様
- [Community projects · Cloudflare D1 docs](https://developers.cloudflare.com/d1/platform/community-projects/) に登録したい。

## D1 の挙動

### JSON 型と object についての調査

- JSON 型は定義はできる
- 内部では文字列型として扱われているっぽい
- INSERT するときも文字列化が必要
- SELECT するときも文字列から JSON に変換する必要がある

### .\* を利用したときの挙動

D1 では `account.*, org.*` のようにすると、同じカラム名を上書きしてしまう。
SQLite3 自体は問題ない挙動なので、 現時点で D1 側の仕様。

### bigint が利用できない

D1 では bigint が利用できない。

https://developers.cloudflare.com/d1/platform/client-api/#type-conversion

> 1 D1 supports 64-bit signed INTEGER values internally, however BigInts are not currently supported in the API yet. JavaScript integers are safe up to Number.MAX_SAFE_INTEGER.

## 参考資料

- https://github.com/sqlc-dev/sqlc/issues/296#issuecomment-1250407683
  - sqlc 作者による typescript-pg 向け sqlc のイメージコード
- https://github.com/tabbed/sqlc-gen-python
  - Go (wasm) で書かれている
  - sqlc 作者による python-pg 向けの sqlc plugin のコード
- https://github.com/tabbed/sqlc-gen-kotlin
  - Go (wasm) で書かれている
  - sqlc 作者による kotlin-pg 向けの sqlc plugin のコード
- [Cloudflare D1 を type\-safe で O/R マッパーぽく使用できるようにする](https://zenn.dev/chimame/articles/23aafcc2e70f33)
  - sqldef を使ってるらしいので、 sqlc と sqldef 組み合わせたい
- https://miniflare.dev/testing/vitest
  - miniflare で vitest を使った例

## SQL

### schema.sql

```sql
CREATE TABLE org (
  pk INTEGER PRIMARY KEY,
  id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL
);

CREATE TABLE account (
  pk INTEGER PRIMARY KEY,
  id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT
);

CREATE TABLE org_account (
  org_pk INTEGER NOT NULL,
  account_pk INTEGER NOT NULL,
  PRIMARY KEY (org_pk, account_pk),
  FOREIGN KEY (org_pk) REFERENCES org (pk) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (account_pk) REFERENCES account (pk) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE account_log (
  pk INTEGER PRIMARY KEY,
  tag TEXT NOT NULL,
  time TEXT DEFAULT CURRENT_TIMESTAMP,
  -- TEXT に対して JSON クエリー利用可能
  data TEXT NOT NULL
)
```

### query.sql

```sql
-- name: GetAccount :one
SELECT *
FROM account
WHERE id = @id;

-- name: ListAccounts :many
SELECT *
FROM account;

-- name: CreateAccount :exec
INSERT INTO account (id, display_name, email)
VALUES (@id, @display_name, @email);

-- name: UpdateAccountDisplayName :one
UPDATE account
SET display_name = @display_name
WHERE id = @id
RETURNING *;

-- name: DeleteAccount :exec
DELETE FROM account
WHERE id = @id;

-- name: CreateOrg :exec
INSERT INTO org (id, display_name)
VALUES (@id, @display_name);

-- name: CreateOrgAccount :exec
INSERT INTO org_account (org_pk, account_pk)
VALUES (@org_pk, @account_pk);

-- name: GetOrgAccount :one
SELECT
  -- account.*, org.*
  account.pk AS account_pk,
  account.id AS account_id,
  account.display_name AS account_display_name,
  account.email AS account_email,
  org.pk AS org_pk,
  org.id AS org_id,
  org.display_name AS org_display_name
FROM
  account
JOIN
  org_account ON account.pk = org_account.account_pk
JOIN
  org ON org_account.org_pk = org.pk
WHERE
  org.id = @org_id AND account.id = @account_id;
```

## 生成

- [x] @display_name は displayName に変換されてほしい
- [x] 戻りは D1Result にするのが良さそう
- [x] src/gen/sqlc 以下に生成される
  - アウトプット先は指定できるべき
- 生成ファイル
  - db.ts?
    - これを import して使う
  - [x] models.ts?
    - schema の struct がある
  - [x] querier.ts?
    - 全てのクエリーがある
  - \*.sql.ts 系
    - いるのか？
    - get_account.sql.ts
    - list_accounts.sql.ts
    - create_account.sql.ts
    - update_account.sql.ts
- [x] one の場合は first() で良さそう
  - LIMIT 1; 付ける癖を付けるのが無難か
- [x] many の場合は all() で良さそう
- [x] exec の場合は run() で良さそう
- db.batch をどうするか
  - 特になにもせず `D1.batch([D1.createAccount(...), D1.createAccount(...)])` でよさそう

## 利用例

```console
$ git git@github.com:orisano/sqlc-gen-ts-d1.git
$ cd sqlc-gen-typescript-d1
$ make
```

```console
$ cp ~/sqlc-gen-ts-d1/bin/sqlc-gen-ts-d1.wasm ~/sqlc-gen-ts-d1-spec/.sqlc-plugin/sqlc-gen-ts-d1.wasm
$ cat sqlc-gen-ts-d1.wasm.sha256
$ ~/bin/sqlc-dev generate
```

```console
$ pnpm install
$ pnpm run d1-import
$ pnpm run dev
```

```js
import * as db from './gen/sqlc/querier'

export interface Env {
  D1_TEST: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // すでに作られている場合は例外が上がるのでキャッチ
      const result = await db.createAccount(env.D1_TEST, {
        id: 'voluntas',
        displayName: 'V',
        email: 'v@example.com',
      })
    } catch (error) {
      // console.log(error)
    }

    // results は D1Result<T>[] になる
    const results = await env.D1_TEST.batch([
      db.createAccount(env.D1_TEST, {}),
      db.createAccount(env.D1_TEST, {})
    ])
    //
    console.log(results[0].success)
    console.log(results[1].success)


    // 存在しない場合は [] が戻ってくるはず
    const result = await db.listAccounts(env.D1_TEST)
    console.log(result)

    // 存在しない場合は null が戻ってくる、はず
    const account = await db.getAccount(env.D1_TEST, {
      id: 'voluntas',
    })
    if (!account) {
      return new Response('Not Found', { status: 404 })
    }
    console.log(account)

    return new Response(JSON.stringify(account), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  },
}
```

## sqlc.json

```javascript
{
  "version": "2",
  "plugins": [
    {
      "name": "ts-d1",
      "wasm": {
        "url": "https://github.com/orisano/sqlc-gen-ts-d1/releases/download/v0.0.0-a/sqlc-gen-ts-d1.wasm",
        "sha256": "77503e225c4bafdf000fa9856ccb582e6bce6e3dad134576ec4dbccf2716bc06"
      }
    }
  ],
  "sql": [
    {
      "schema": "db/schema.sql",
      "queries": "db/query.sql",
      "engine": "sqlite",
      "codegen": [
        {
          "out": "src/gen/sqlc",
          "plugin": "ts-d1",
          "options": "workers-types=experimental"
        }
      ]
    }
  ]
}
```

### options

workers-types=experimental で @cloudflare/workers-types の最新が利用できる。

### null の扱い

- pgx/v4 で利用可能な Go の型が \*time.Time などになる方式
- SQLite もこれと似たような仕組みがあると嬉しそう
- スキーマから null が入る可能性があるカラムを探して、そのカラムの型を nullable にする
- 型的には null | string で問題ないはず

## D1 の型

https://github.com/cloudflare/workerd/blob/main/types/defines/d1.d.ts

```typescript
interface D1Result<T = unknown> {
  results: T[]
  success: true
  meta: any
  error?: never
}

interface D1ExecResult {
  count: number
  duration: number
}

declare abstract class D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
}

declare abstract class D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName: string): Promise<T | null>
  first<T = Record<string, unknown>>(): Promise<T | null>
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  raw<T = unknown[]>(): Promise<T[]>
}
```

## ライセンス

Apache License 2.0

```
Copyright 2023-2023, @voluntas

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
