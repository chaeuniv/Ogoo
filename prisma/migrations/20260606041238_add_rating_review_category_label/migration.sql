-- AlterTable
ALTER TABLE "consumptions" ADD COLUMN     "categoryLabel" VARCHAR(20),
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "reviewReason" VARCHAR(100);
