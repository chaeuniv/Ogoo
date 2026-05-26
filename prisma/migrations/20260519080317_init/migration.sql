-- CreateEnum
CREATE TYPE "Category" AS ENUM ('FOOD', 'TRANSPORT', 'SHOPPING', 'ENTERTAINMENT', 'HEALTH', 'OTHER');

-- CreateEnum
CREATE TYPE "Keyword" AS ENUM ('STABLE', 'IMPULSE', 'STRESS', 'REWARD');

-- CreateTable
CREATE TABLE "consumptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "keyword" "Keyword" NOT NULL,
    "emotion" INTEGER NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL,
    "memo" VARCHAR(200),
    "uploadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumptions_pkey" PRIMARY KEY ("id")
);
