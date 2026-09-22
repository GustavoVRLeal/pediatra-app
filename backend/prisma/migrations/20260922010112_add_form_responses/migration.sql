/*
  Warnings:

  - A unique constraint covering the columns `[publicToken]` on the table `Form` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Answer" ADD COLUMN     "formResponseId" TEXT;

-- AlterTable
ALTER TABLE "public"."Form" ADD COLUMN     "publicToken" TEXT;

-- CreateTable
CREATE TABLE "public"."FormResponse" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Form_publicToken_key" ON "public"."Form"("publicToken");

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_formResponseId_fkey" FOREIGN KEY ("formResponseId") REFERENCES "public"."FormResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FormResponse" ADD CONSTRAINT "FormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "public"."Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
