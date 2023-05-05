-- name: CreateOrgAccount :exec
INSERT INTO org_account (org_pk, account_pk)
VALUES (@org_pk, @account_pk);

-- name: GetOrgAccount :one
SELECT sqlc_embed(account),
  sqlc_embed(org)
FROM account
  JOIN org_account ON account.pk = org_account.account_pk
  JOIN org ON org_account.org_pk = org.pk
WHERE org.id = @org_id
  AND account.id = @account_id;