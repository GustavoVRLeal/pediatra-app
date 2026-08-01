/*
  Warnings:

  - Changed the type of `type` on the `Question` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'MULTIPLE_CHOICE');

-- AlterTable
ALTER TABLE "public"."Question" DROP COLUMN "type",
ADD COLUMN     "type" "public"."QuestionType" NOT NULL;
