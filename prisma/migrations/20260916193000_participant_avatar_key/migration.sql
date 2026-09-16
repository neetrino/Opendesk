-- Expand: optional sticker key, unique per board when set.
ALTER TABLE "Participant" ADD COLUMN "avatarKey" TEXT;

CREATE UNIQUE INDEX "Participant_boardId_avatarKey_key"
ON "Participant"("boardId", "avatarKey");
