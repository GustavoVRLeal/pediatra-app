/*
  Warnings:

  - You are about to drop the column `age` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `responsible` on the `Patient` table. All the data in the column will be lost.
  - Added the required column `birthDate` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guaardianEmail` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guardianName` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guardianPhone` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pediatricianId` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Patient" DROP CONSTRAINT "Patient_doctorId_fkey";

-- AlterTable
ALTER TABLE "public"."Patient" DROP COLUMN "age",
DROP COLUMN "doctorId",
DROP COLUMN "phone",
DROP COLUMN "responsible",
ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "guaardianEmail" TEXT NOT NULL,
ADD COLUMN     "guardianName" TEXT NOT NULL,
ADD COLUMN     "guardianPhone" TEXT NOT NULL,
ADD COLUMN     "height" TEXT NOT NULL,
ADD COLUMN     "pediatricianId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Patient" ADD CONSTRAINT "Patient_pediatricianId_fkey" FOREIGN KEY ("pediatricianId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
