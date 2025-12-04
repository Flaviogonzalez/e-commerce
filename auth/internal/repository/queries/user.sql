-- name: CreateUser :one
INSERT INTO users (
    email,
    password_hash,
    created_at,
    updated_at
) VALUES (
    $1, $2, NOW(), NOW()
) RETURNING *;

-- name: GetUserByID :one
SELECT 
    id,
    email,
    email_verified,
    phone,
    phone_verified,
    avatar_url,
    status,
    role,
    last_login_at,
    created_at,
    updated_at
FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: ListUsers :many
SELECT 
    id,
    email,
    email_verified,
    phone,
    phone_verified,
    avatar_url,
    status,
    role,
    last_login_at,
    created_at,
    updated_at
FROM users
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateUser :one
UPDATE users
SET
    email = COALESCE(sqlc.narg('email'), email),
    email_verified = COALESCE(sqlc.narg('email_verified'), email_verified),
    phone = COALESCE(sqlc.narg('phone'), phone),
    phone_verified = COALESCE(sqlc.narg('phone_verified'), phone_verified),
    avatar_url = COALESCE(sqlc.narg('avatar_url'), avatar_url),
    status = COALESCE(sqlc.narg('status'), status),
    role = COALESCE(sqlc.narg('role'), role),
    failed_login_attempts = COALESCE(sqlc.narg('failed_login_attempts'), failed_login_attempts),
    locked_until = COALESCE(sqlc.narg('locked_until'), locked_until),
    last_login_at = COALESCE(sqlc.narg('last_login_at'), last_login_at),
    last_login_ip = COALESCE(sqlc.narg('last_login_ip'), last_login_ip),
    password_changed_at = COALESCE(sqlc.narg('password_changed_at'), password_changed_at),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateUserPassword :exec
UPDATE users
SET
    password_hash = $2,
    updated_at = NOW()
WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;

-- name: CountUsers :one
SELECT COUNT(*) FROM users;