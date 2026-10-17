-- CreateTable
CREATE TABLE "BoardAgentAccess" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardAgentAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoardAgentAccess_boardId_key" ON "BoardAgentAccess"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardAgentAccess_keyHash_key" ON "BoardAgentAccess"("keyHash");

-- AddForeignKey
ALTER TABLE "BoardAgentAccess" ADD CONSTRAINT "BoardAgentAccess_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
