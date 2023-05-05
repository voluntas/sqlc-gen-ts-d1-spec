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

-- name: GetOrgAccount :one
SELECT
  account.*,
  org.*
FROM
  account
JOIN
  org_account ON account.pk = org_account.account_pk
JOIN
  org ON org_account.org_pk = org.pk
WHERE
  org.id = @org_id AND account.id = @account_id;
