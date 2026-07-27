-- Expand: add board slug for human-readable join URLs `/b/{slug}/{joinToken}`
ALTER TABLE "Board" ADD COLUMN "slug" TEXT;

UPDATE "Board"
SET "slug" =
  lower(
    regexp_replace(
      regexp_replace(trim(title), '[^[:alnum:]]+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    )
  )
WHERE "slug" IS NULL;

UPDATE "Board"
SET "slug" = 'board'
WHERE "slug" IS NULL OR "slug" = '';

-- Ensure uniqueness for existing rows
WITH ranked AS (
  SELECT
    id,
    "slug",
    ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "createdAt" ASC) AS rn
  FROM "Board"
)
UPDATE "Board" AS b
SET "slug" = ranked."slug" || '-' || substr(md5(ranked.id), 1, 6)
FROM ranked
WHERE b.id = ranked.id AND ranked.rn > 1;

ALTER TABLE "Board" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Board_slug_key" ON "Board"("slug");
