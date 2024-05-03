/*
  Warnings:

  - You are about to drop the column `status` on the `class_attendees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "class_attendees" DROP COLUMN "status",
ADD COLUMN     "crash_course_id" TEXT;

-- DropEnum
DROP TYPE "ClassAttendeeStatus";

-- AddForeignKey
ALTER TABLE "class_attendees" ADD CONSTRAINT "class_attendees_crash_course_id_fkey" FOREIGN KEY ("crash_course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
