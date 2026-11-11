-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "options" TEXT[] DEFAULT ARRAY[]::TEXT[];
