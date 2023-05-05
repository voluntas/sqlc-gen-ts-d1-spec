-- name: CreateOrg :exec
INSERT INTO org (id, display_name)
VALUES (@id, @display_name);