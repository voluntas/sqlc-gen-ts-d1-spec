import {D1Database, D1Result} from "@cloudflare/workers-types/2022-11-30"

const getAccountQuery = `-- name: GetAccount :one
SELECT pk, id, display_name, email
FROM account
WHERE id = ?1`;

export type GetAccountParams = {
  id: string;
};

export type GetAccountRow = {
  pk: number;
  id: string;
  displayName: string;
  email: string | null;
};

type RawGetAccountRow = {
  pk: number;
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

export type ListAccountsRow = {
  pk: number;
  id: string;
  displayName: string;
  email: string | null;
};

type RawListAccountsRow = {
  pk: number;
  id: string;
  display_name: string;
  email: string | null;
};

export async function listAccounts(
  d1: D1Database
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
      }}) : undefined,
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

export async function createAccount(
  d1: D1Database,
  args: CreateAccountParams
): Promise<D1Result> {
  return await d1
    .prepare(createAccountQuery)
    .bind(args.id, args.displayName, args.email)
    .run();
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
  pk: number;
  id: string;
  displayName: string;
  email: string | null;
};

type RawUpdateAccountDisplayNameRow = {
  pk: number;
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

export async function deleteAccount(
  d1: D1Database,
  args: DeleteAccountParams
): Promise<D1Result> {
  return await d1
    .prepare(deleteAccountQuery)
    .bind(args.id)
    .run();
}

const createOrgQuery = `-- name: CreateOrg :exec
INSERT INTO org (id, display_name)
VALUES (?1, ?2)`;

export type CreateOrgParams = {
  id: string;
  displayName: string;
};

export async function createOrg(
  d1: D1Database,
  args: CreateOrgParams
): Promise<D1Result> {
  return await d1
    .prepare(createOrgQuery)
    .bind(args.id, args.displayName)
    .run();
}

const createOrgAccountQuery = `-- name: CreateOrgAccount :exec
INSERT INTO org_account (org_pk, account_pk)
VALUES (?1, ?2)`;

export type CreateOrgAccountParams = {
  orgPk: number;
  accountPk: number;
};

export async function createOrgAccount(
  d1: D1Database,
  args: CreateOrgAccountParams
): Promise<D1Result> {
  return await d1
    .prepare(createOrgAccountQuery)
    .bind(args.orgPk, args.accountPk)
    .run();
}

