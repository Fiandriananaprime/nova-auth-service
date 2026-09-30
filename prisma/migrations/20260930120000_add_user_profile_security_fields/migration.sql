ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "pending_email" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "pending_phone" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMPTZ(6) DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "last_login_ip" TEXT,
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS "users_pending_email_key" ON "users"("pending_email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_pending_phone_key" ON "users"("pending_phone");
