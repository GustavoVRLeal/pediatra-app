/*
  Warnings:

  - You are about to drop the column `guaardianEmail` on the `Patient` table. All the data in the column will be lost.
  - Added the required column `guardianEmail` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Patient" DROP COLUMN "guaardianEmail",
ADD COLUMN     "guardianEmail" TEXT NOT NULL;
