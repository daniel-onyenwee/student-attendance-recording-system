/*
  Warnings:

  - A unique constraint covering the columns `[attendance_register_id,attendance_register_lecturer_id,date]` on the table `class_attendances` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "class_attendances_attendance_register_id_attendance_registe_key";

-- CreateIndex
CREATE UNIQUE INDEX "class_attendances_attendance_register_id_attendance_registe_key" ON "class_attendances"("attendance_register_id", "attendance_register_lecturer_id", "date");
