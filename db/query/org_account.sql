-- name: CreateOrgAccount :exec
INSERT INTO org_account (org_pk, account_pk)
VALUES (@org_pk, @account_pk);

-- name: GetOrgAccount :one
SELECT account.pk AS account_pk,
  account.id AS account_id,
  account.display_name AS account_display_name,
  account.email AS account_email,
  org.pk AS org_pk,
  org.id AS org_id,
  org.display_name AS org_display_name
FROM account
  JOIN org_account ON account.pk = org_account.account_pk
  JOIN org ON org_account.org_pk = org.pk
WHERE org.id = @org_id
  AND account.id = @account_id;