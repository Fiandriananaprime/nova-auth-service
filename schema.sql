-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'buyer',
    'seller',
    'admin'
);

CREATE TYPE user_status AS ENUM (
    'active',
    'suspended'
);

CREATE TYPE admin_role AS ENUM (
    'super_admin',
    'admin',
    'moderator',
    'delivery'
);

CREATE TYPE verification_channel AS ENUM (
    'email',
    'phone'
);

CREATE TYPE verification_purpose AS ENUM (
    'email_verification',
    'phone_verification',
    'two_factor',
    'email_change'
);


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    phone VARCHAR(30) UNIQUE,

    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'active',

    admin_role admin_role,

    avatar_url TEXT,

    email_verified BOOLEAN NOT NULL DEFAULT false,
    phone_verified BOOLEAN NOT NULL DEFAULT false,

    last_login_at TIMESTAMPTZ(6),
    last_login_ip TEXT,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT users_admin_role_check
        CHECK (
            role = 'admin'
            OR admin_role IS NULL
        )
);


-- ============================================================
-- USER SESSIONS
-- ============================================================

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    refresh_token_hash TEXT UNIQUE,

    device TEXT,
    browser TEXT,
    operating_system TEXT,

    ip_address TEXT,
    location TEXT,

    last_active_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    expires_at TIMESTAMPTZ(6) NOT NULL,
    revoked_at TIMESTAMPTZ(6),

    remember BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- VERIFICATION CODES
-- ============================================================

CREATE TABLE verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID,

    channel verification_channel NOT NULL,
    purpose verification_purpose NOT NULL,

    destination TEXT,

    code_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ(6) NOT NULL,
    consumed_at TIMESTAMPTZ(6),

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT fk_verification_codes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ(6) NOT NULL,
    consumed_at TIMESTAMPTZ(6),

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- TWO FACTOR SETTINGS
-- ============================================================

CREATE TABLE two_factor_settings (
    user_id UUID PRIMARY KEY,

    enabled BOOLEAN NOT NULL DEFAULT false,

    secret_encrypted TEXT,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    verified_at TIMESTAMPTZ(6),

    CONSTRAINT fk_two_factor_settings_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- TWO FACTOR RECOVERY CODES
-- ============================================================

CREATE TABLE two_factor_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    code_hash TEXT NOT NULL UNIQUE,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    used_at TIMESTAMPTZ(6),

    CONSTRAINT fk_two_factor_recovery_codes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- CSRF TOKENS
-- ============================================================

CREATE TABLE csrf_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ(6) NOT NULL,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    used_at TIMESTAMPTZ(6),

    CONSTRAINT fk_csrf_tokens_session
        FOREIGN KEY (session_id)
        REFERENCES user_sessions(id)
        ON DELETE CASCADE
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_role_status
    ON users (role, status);

CREATE INDEX idx_users_last_login_at
    ON users (last_login_at DESC);


CREATE INDEX idx_user_sessions_user_active
    ON user_sessions (user_id, revoked_at, expires_at);


CREATE INDEX idx_verification_codes_user_purpose
    ON verification_codes (user_id, purpose, expires_at);


CREATE INDEX idx_password_reset_user
    ON password_reset_tokens (user_id, expires_at);


CREATE INDEX idx_recovery_codes_user
    ON two_factor_recovery_codes (user_id, used_at);


CREATE INDEX idx_csrf_tokens_session
    ON csrf_tokens (session_id, expires_at);