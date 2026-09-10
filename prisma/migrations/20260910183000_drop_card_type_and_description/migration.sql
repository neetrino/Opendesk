-- Chat is the only place for card details. Drop unused type/description.
ALTER TABLE "Card" DROP COLUMN "description";
ALTER TABLE "Card" DROP COLUMN "type";
DROP TYPE "CardType";
