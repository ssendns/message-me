-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_fromId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_toId_fkey";

-- AlterTable
ALTER TABLE "public"."Message" ALTER COLUMN "fromId" DROP NOT NULL,
ALTER COLUMN "toId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_toId_fkey" FOREIGN KEY ("toId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
