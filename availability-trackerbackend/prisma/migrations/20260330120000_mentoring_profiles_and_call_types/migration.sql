-- Drop Google-specific columns
ALTER TABLE "User" DROP COLUMN IF EXISTS "google_refresh_token";

ALTER TABLE "Meeting" DROP COLUMN IF EXISTS "calendar_event_id";
ALTER TABLE "Meeting" DROP COLUMN IF EXISTS "google_event_id";

-- User profile fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Call type enum and meeting links
DO $$ BEGIN
 CREATE TYPE "CallType" AS ENUM ('RESUME_REVAMP', 'JOB_MARKET_GUIDANCE', 'MOCK_INTERVIEW');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "call_type" "CallType";
ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "mentee_id" TEXT;
ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "mentor_id" TEXT;

DO $$ BEGIN
 ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "Meeting_mentee_id_idx" ON "Meeting"("mentee_id");
CREATE INDEX IF NOT EXISTS "Meeting_mentor_id_idx" ON "Meeting"("mentor_id");
