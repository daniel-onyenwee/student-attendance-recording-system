/*
  Warnings:

  - You are about to drop the column `crash_course_id` on the `class_attendees` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[class_attendee_id]` on the table `crash_course_attendances` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `class_attendee_id` to the `crash_course_attendances` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "class_attendees" DROP CONSTRAINT "class_attendees_crash_course_id_fkey";

-- AlterTable
ALTER TABLE "class_attendees" DROP COLUMN "crash_course_id";

-- AlterTable
ALTER TABLE "crash_course_attendances" ADD COLUMN     "class_attendee_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "crash_course_attendances_class_attendee_id_key" ON "crash_course_attendances"("class_attendee_id");

-- AddForeignKey
ALTER TABLE "crash_course_attendances" ADD CONSTRAINT "crash_course_attendances_class_attendee_id_fkey" FOREIGN KEY ("class_attendee_id") REFERENCES "class_attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
