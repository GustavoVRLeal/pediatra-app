/*
  Warnings:

  - Changed the type of `height` on the `Patient` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Patient" DROP COLUMN "height",
ADD COLUMN     "height" DOUBLE PRECISION NOT NULL;
