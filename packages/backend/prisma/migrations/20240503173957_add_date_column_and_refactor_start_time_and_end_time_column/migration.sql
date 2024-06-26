/*
  Warnings:

  - Added the required column `date` to the `crash_course_attendances` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "crash_course_attendances" ADD COLUMN     "date" DATE NOT NULL,
ALTER COLUMN "start_time" SET DATA TYPE TIME,
ALTER COLUMN "end_time" SET DATA TYPE TIME;
