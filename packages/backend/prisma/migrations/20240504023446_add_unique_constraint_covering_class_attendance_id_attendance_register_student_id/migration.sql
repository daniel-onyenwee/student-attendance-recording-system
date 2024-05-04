/*
  Warnings:

  - A unique constraint covering the columns `[class_attendance_id,attendance_register_student_id]` on the table `class_attendees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "class_attendees_class_attendance_id_attendance_register_stu_key" ON "class_attendees"("class_attendance_id", "attendance_register_student_id");
