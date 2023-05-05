# Cloudflare D1 向けの sqlc plugin (Wasm) の設計仕様

## 概要

このリポジトリは Cloudflare D1 で sqlc で利用するための設計仕様を記載しています。

## 動作確認

https://github.com/orisano/sqlc-gen-typescript-d1

動作確認を行うために、このリポジトリを作成しています。

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

- Makefile で sqlc generate を実行する仕組み
- vitest で sqlc 経由で生成したコードのテスト
- D1 が対応したら tx のテスト
- batch の仕様

## 参考資料

- https://github.com/kyleconroy/sqlc/issues/296#issuecomment-1250407683
  - sqlc 作者による typescript-pg 向け sqlc のイメージコード
- https://github.com/tabbed/sqlc-gen-node-pg
  - Rust (wasm) で書かれてる
  - sqlc 作者による node-pg 向けの sqlc plugin のコード
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
CREATE TABLE account (
  pk INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT
);
```

### query.sql

```sql
-- name: GetAccount :one
SELECT *
FROM account
WHERE id = @id:text;

-- name: ListAccounts :many
SELECT *
FROM account;

-- name: CreateAccount :exec
INSERT INTO account (id, display_name, email)
VALUES (@id, @display_name, @email);

-- name: UpdateAccountDisplayName :one
UPDATE account
SET display_name = @display_name
WHERE id = @id:text
RETURNING *;

-- name: DeleteAccount :exec
DELETE FROM account
WHERE id = @id:text;
```

## 生成

- @display_name は displayName に変換されてほしい
- 戻りは D1Result にするのが良さそう
- src/gen/sqlc 以下に生成される
  - アウトプット先は指定できるべき
- 生成ファイル
  - db.ts?
    - これを import して使う
  - models.ts?
    - schema の struct がある
  - querier.ts?
    - 全てのクエリーがある
  - \*.sql.ts 系
    - いるのか？
    - get_account.sql.ts
    - list_accounts.sql.ts
    - create_account.sql.ts
    - update_account.sql.ts
- one の場合は first() で良さそう
  - LIMIT 1; 付ける癖を付けるのが無難か
- many の場合は all() で良さそう
- exec の場合は run() で良さそう
- batch をどうするか
  - D1.batch があるので実現は可能そう

### querier.ts

これは実際に生成されたコードに対してコメントを付与しています。

```js
//
import {D1Database, D1Result} from "@cloudflare/workers-types/2022-11-30"

const getAccountQuery = `-- name: GetAccount :one
SELECT pk, id, display_name, email
FROM account
WHERE id = ?1`;

export type GetAccountParams = {
  id: string;
};

export type GetAccountRow = {
  pk: bigint;
  id: string;
  displayName: string;
  email: string | null;
};

type RawGetAccountRow = {
  pk: bigint;
  id: string;
  display_name: string;
  email: string | null;
};

export async function getAccount(
  d1: D1Database,
  args: GetAccountParams
): Promise<GetAccountRow | null> {
  return await d1
    .prepare(getAccountQuery)
    .bind(args.id)
    .first<RawGetAccountRow | null>()
    .then((raw: RawGetAccountRow | null) => raw ? {
      pk: raw.pk,
      id: raw.id,
      displayName: raw.display_name,
      email: raw.email,
    } : null);
}

const listAccountsQuery = `-- name: ListAccounts :many
SELECT pk, id, display_name, email
FROM account`;

export type ListAccountsParams = {
};

export type ListAccountsRow = {
  pk: bigint;
  id: string;
  displayName: string;
  email: string | null;
};

type RawListAccountsRow = {
  pk: bigint;
  id: string;
  display_name: string;
  email: string | null;
};

export async function listAccounts(
  d1: D1Database,
  args: ListAccountsParams
): Promise<D1Result<ListAccountsRow>> {
  return await d1
    .prepare(listAccountsQuery)
    .all<RawListAccountsRow>()
    .then((r: D1Result<RawListAccountsRow>) => { return {
      ...r,
      results: r.results ? r.results.map((raw: RawListAccountsRow) => { return {
        pk: raw.pk,
        id: raw.id,
        displayName: raw.display_name,
        email: raw.email,
      // ここは undefined じゃないとだめそう
      }}) : null,
    }});
}

const createAccountQuery = `-- name: CreateAccount :exec
INSERT INTO account (id, display_name, email)
VALUES (?1, ?2, ?3)`;

export type CreateAccountParams = {
  id: string;
  displayName: string;
  email: string | null;
};

export type CreateAccountRow = {
};

export async function createAccount(
  d1: D1Database,
  args: CreateAccountParams
): Promise<D1Result<CreateAccountRow>> {
  return await d1
    .prepare(createAccountQuery)
    .bind(args.id, args.displayName, args.email)
    .run<CreateAccountRow>();
}

const updateAccountDisplayNameQuery = `-- name: UpdateAccountDisplayName :one
UPDATE account
SET display_name = ?1
WHERE id = ?2
RETURNING pk, id, display_name, email`;

export type UpdateAccountDisplayNameParams = {
  displayName: string;
  id: string;
};

export type UpdateAccountDisplayNameRow = {
  pk: bigint;
  id: string;
  displayName: string;
  email: string | null;
};

type RawUpdateAccountDisplayNameRow = {
  pk: bigint;
  id: string;
  display_name: string;
  email: string | null;
};

export async function updateAccountDisplayName(
  d1: D1Database,
  args: UpdateAccountDisplayNameParams
): Promise<UpdateAccountDisplayNameRow | null> {
  return await d1
    .prepare(updateAccountDisplayNameQuery)
    .bind(args.displayName, args.id)
    .first<RawUpdateAccountDisplayNameRow | null>()
    .then((raw: RawUpdateAccountDisplayNameRow | null) => raw ? {
      pk: raw.pk,
      id: raw.id,
      displayName: raw.display_name,
      email: raw.email,
    } : null);
}

const deleteAccountQuery = `-- name: DeleteAccount :exec
DELETE FROM account
WHERE id = ?1`;

export type DeleteAccountParams = {
  id: string;
};

export type DeleteAccountRow = {
};

export async function deleteAccount(
  d1: D1Database,
  args: DeleteAccountParams
): Promise<D1Result<DeleteAccountRow>> {
  return await d1
    .prepare(deleteAccountQuery)
    .bind(args.id)
    .run<DeleteAccountRow>();
}
```

## 利用例

- import は適当
- remix から利用するイメージ
- global.d.ts に設定されている `D1: D1Database` を引っ張る

```js
from db import './gen/sqlc'

export const action: ActionFunction = async ({ request }) => {
    // one なので GetAccountRaw か null が返される
    // GetAccount
    const account = await db.getAccount(D1, db.GetAccountParams{
      id: 'spam'
    });
    if (!account) {
      // 404
    }

    // 戻りは D1Result で results が ListAccountsRow[] になる
    // ListAccounts
    const result = await db.listAccounts(D1);
    if (!result.success) {
      // 404
    }

    // 戻りは D1Result
    // run なので results は存在しない
    // CreateAccount
    const result = await db.createAccount(D1, db.CreateAccountParams{
      id: 'egg',
      displayName: 'Egg',
      email: 'egg@example.com',
    });
    if (!result.success) {
      // 404
    }

    // one なので first で UpdateAccountDisplayNameRow か null が返される
    // UpdateAccount
    const account = await db.updateAccountDisplayNameQuery(D1, db.updateAccountDisplayNameQueryParams{
      id: 'egg',
      displayName: 'Egg',
    })
    if (account) {
      // 404
    }
  }
}
```

## sqlc.json

```javascript
{
  "version": "2",
  "plugins": [
    {
      "name": "typescript-d1",
      "wasm": {
        // Cloudflare R2 で配信
        "url": "https://sqlc.shiguredo.app/latest/sqlc-gen-typescript-d1.wasm",
        "sha256": "4762fc11c845ea57a0dda3675a58c8c74ed979a102c5c5a4cc2c505208060cf6"
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
          "plugin": "typescript-d1",
          "options": "workers-types-v3=1"
        }
      ]
    }
  ]
}
```

### options

- workers-types-v3=1 で @cloudflare/workers-types の v3 が利用できる
  - v3 自体は廃止されていき、今後は v4 になる流れ
  - v4 のバージョンももしかすると細かく指定できた方がいいのか？

### emit_pointers_for_null_types

- pgx/v4 で利用可能な Go の型が \*time.Time などになる方式
- SQLite もこれと似たような仕組みがあると嬉しそう
- スキーマから null が入る可能性があるカラムを探して、そのカラムの型を nullable にする
- 型的には null | string で問題ないはず
- sqlc への SQLite の対応が必要になる
- sqlc_narg 方式だと null が入る可能性のカラム全てに追加していく必要がある

## D1 メモ

- remix v1 だとグローバルにあるので D1_TEST とかになる

```js
const stmt = D1_TEST.prepare(
  "SELECT * FROM users WHERE name = ?"
).bind("John Doe").first<User | null>();
```

- first と all と run がある
- sqlc 的には one と many と exec に対応する

```js
{
  results: array | null, // [] if empty, or null if it doesn't apply
  success: boolean, // true if the operation was successful, false otherwise
  meta: {
    duration: number, // duration of the operation in milliseconds
  }
}
```

## D1 の型

### 3 系

https://github.com/cloudflare/workers-types/blob/v3.19.0/index.d.ts#L219-L240

```typescript
interface D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec<T = unknown>(query: string): Promise<D1Result<T>>
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T>
  run<T = unknown>(): Promise<D1Result<T>>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown>(): Promise<T[]>
}

declare type D1Result<T = unknown> = {
  results?: T[]
  lastRowId: number | null
  changes: number
  duration: number
  error?: string
}
```

### 4 系

https://github.com/cloudflare/workerd/blob/main/types/defines/d1.d.ts

```typescript
interface D1Result<T = unknown> {
  results?: T[]
  success: boolean
  error?: string
  meta: any
}

declare abstract class D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec<T = unknown>(query: string): Promise<D1Result<T>>
}

declare abstract class D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T>
  run<T = unknown>(): Promise<D1Result<T>>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown>(): Promise<T[]>
}
```

3 系と 4 系で異なるので要注意。

## 自動生成されたコード

```javascript
{
  "version": "2",
  "plugins":
    [
      {
        "name": "typescript-d1",
        "wasm":
          {
            "url": "file://.sqlc-plugin/sqlc-gen-typescript-d1.wasm",
            "sha256": "38dd9bf3214ef94c0beabd0694f6093b5ef2dd4ebe7ba234aac3ccd9f1c34adc",
          },
      },
    ],
  "sql":
    [
      {
        "schema": "db/schema.sql",
        "queries": "db/query.sql",
        "engine": "sqlite",
        "codegen":
          [
            {
              "out": "src/gen/sqlc",
              "plugin": "typescript-d1",
              "options": "workers-types-v4=1",
            },
          ],
      },
    ],
}
```

prettier が走ってる野で、色々変更される。
基本的にいじらない方がいいので、ignore に指定した方がよさそう。

```typescript
import { D1Database, D1Result } from '@cloudflare/workers-types/2022-11-30'

const getAccountQuery = `-- name: GetAccount :one
SELECT pk, id, display_name, email
FROM account
WHERE id = ?1`

export type GetAccountParams = {
  id: string
}

export type GetAccountRow = {
  pk: bigint
  id: string
  displayName: string
  email: string | null
}

type RawGetAccountRow = {
  pk: bigint
  id: string
  display_name: string
  email: string | null
}

export async function getAccount(
  d1: D1Database,
  args: GetAccountParams,
): Promise<GetAccountRow | null> {
  return await d1
    .prepare(getAccountQuery)
    .bind(args.id)
    .first<RawGetAccountRow | null>()
    .then((raw: RawGetAccountRow | null) =>
      raw
        ? {
            pk: raw.pk,
            id: raw.id,
            displayName: raw.display_name,
            email: raw.email,
          }
        : null,
    )
}

const listAccountsQuery = `-- name: ListAccounts :many
SELECT pk, id, display_name, email
FROM account`

export type ListAccountsParams = {}

export type ListAccountsRow = {
  pk: bigint
  id: string
  displayName: string
  email: string | null
}

type RawListAccountsRow = {
  pk: bigint
  id: string
  display_name: string
  email: string | null
}

export async function listAccounts(
  d1: D1Database,
  args: ListAccountsParams,
): Promise<D1Result<ListAccountsRow>> {
  return await d1
    .prepare(listAccountsQuery)
    .all<RawListAccountsRow>()
    .then((r: D1Result<RawListAccountsRow>) => {
      return {
        ...r,
        results: r.results
          ? r.results.map((raw: RawListAccountsRow) => {
              return {
                pk: raw.pk,
                id: raw.id,
                displayName: raw.display_name,
                email: raw.email,
              }
            })
          : null,
      }
    })
}

const createAccountQuery = `-- name: CreateAccount :exec
INSERT INTO account (id, display_name, email)
VALUES (?1, ?2, ?3)`

export type CreateAccountParams = {
  id: string
  displayName: string
  email: string | null
}

export type CreateAccountRow = {}

export async function createAccount(
  d1: D1Database,
  args: CreateAccountParams,
): Promise<D1Result<CreateAccountRow>> {
  return await d1
    .prepare(createAccountQuery)
    .bind(args.id, args.displayName, args.email)
    .run<CreateAccountRow>()
}

const updateAccountDisplayNameQuery = `-- name: UpdateAccountDisplayName :one
UPDATE account
SET display_name = ?1
WHERE id = ?2
RETURNING pk, id, display_name, email`

export type UpdateAccountDisplayNameParams = {
  displayName: string
  id: string
}

export type UpdateAccountDisplayNameRow = {
  pk: bigint
  id: string
  displayName: string
  email: string | null
}

type RawUpdateAccountDisplayNameRow = {
  pk: bigint
  id: string
  display_name: string
  email: string | null
}

export async function updateAccountDisplayName(
  d1: D1Database,
  args: UpdateAccountDisplayNameParams,
): Promise<UpdateAccountDisplayNameRow | null> {
  return await d1
    .prepare(updateAccountDisplayNameQuery)
    .bind(args.displayName, args.id)
    .first<RawUpdateAccountDisplayNameRow | null>()
    .then((raw: RawUpdateAccountDisplayNameRow | null) =>
      raw
        ? {
            pk: raw.pk,
            id: raw.id,
            displayName: raw.display_name,
            email: raw.email,
          }
        : null,
    )
}

const deleteAccountQuery = `-- name: DeleteAccount :exec
DELETE FROM account
WHERE id = ?1`

export type DeleteAccountParams = {
  id: string
}

export type DeleteAccountRow = {}

export async function deleteAccount(
  d1: D1Database,
  args: DeleteAccountParams,
): Promise<D1Result<DeleteAccountRow>> {
  return await d1.prepare(deleteAccountQuery).bind(args.id).run<DeleteAccountRow>()
}
```
