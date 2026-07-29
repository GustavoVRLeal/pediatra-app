/*
  Warnings:

  - Added the required column `updateAt` to the `Form` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."FormStatus" AS ENUM ('DRAFT', 'SENT', 'ANSWERED', 'CLOSED');

-- AlterTable
ALTER TABLE "public"."Form" ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" "public"."FormStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updateAt" TIMESTAMP(3) NOT NULL;
