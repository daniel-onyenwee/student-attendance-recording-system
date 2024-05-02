/*
  Warnings:

  - You are about to drop the column `lecturerId` on the `crash_course_attendances` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "crash_course_attendances" DROP CONSTRAINT "crash_course_attendances_lecturerId_fkey";

-- AlterTable
ALTER TABLE "crash_course_attendances" DROP COLUMN "lecturerId";
