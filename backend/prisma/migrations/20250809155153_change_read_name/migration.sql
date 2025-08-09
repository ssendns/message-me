/*
  Warnings:

  - You are about to drop the column `hasUnread` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "hasUnread",
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false;
