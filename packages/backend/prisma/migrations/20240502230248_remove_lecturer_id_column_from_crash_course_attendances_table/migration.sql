/*
  Warnings:

  - You are about to drop the column `lecturer_id` on the `crash_course_attendances` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "crash_course_attendances" DROP CONSTRAINT "crash_course_attendances_lecturer_id_fkey";

-- AlterTable
ALTER TABLE "crash_course_attendances" DROP COLUMN "lecturer_id",
ADD COLUMN     "lecturerId" TEXT;

-- AddForeignKey
ALTER TABLE "crash_course_attendances" ADD CONSTRAINT "crash_course_attendances_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
