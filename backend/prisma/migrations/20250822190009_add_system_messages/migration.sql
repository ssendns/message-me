-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_fromId_fkey";

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "meta" JSONB,
ADD COLUMN     "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "fromId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
