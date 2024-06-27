/*
  Warnings:

  - You are about to drop the column `decision` on the `attendance_register_students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attendance_register_students" DROP COLUMN "decision";

-- DropEnum
DROP TYPE "StudentAttendanceRegisterStatus";
