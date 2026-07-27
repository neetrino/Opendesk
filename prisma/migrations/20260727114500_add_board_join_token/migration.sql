-- Expand: add nullable join token, backfill existing boards, then require unique.
ALTER TABLE "Board" ADD COLUMN "joinToken" TEXT;

UPDATE "Board"
SET "joinToken" =
  substr(md5(random()::text || clock_timestamp()::text || id), 1, 16)
  || substr(md5(id || random()::text || clock_timestamp()::text), 1, 16)
WHERE "joinToken" IS NULL;

ALTER TABLE "Board" ALTER COLUMN "joinToken" SET NOT NULL;

CREATE UNIQUE INDEX "Board_joinToken_key" ON "Board"("joinToken");
