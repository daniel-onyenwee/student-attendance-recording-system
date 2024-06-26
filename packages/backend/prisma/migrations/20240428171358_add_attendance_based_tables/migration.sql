-- CreateEnum
CREATE TYPE "ClassAttendeeStatus" AS ENUM ('PRESENT', 'ABSENT');

-- CreateEnum
CREATE TYPE "StudentAttendanceRegisterStatus" AS ENUM ('ADMIT', 'REJECT');

-- CreateTable
CREATE TABLE "attendance_registers" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "decision" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "attendance_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_register_lecturers" (
    "id" TEXT NOT NULL,
    "attendance_register_id" TEXT NOT NULL,
    "lecturer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "attendance_register_lecturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_register_students" (
    "id" TEXT NOT NULL,
    "attendance_register_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "decision" "StudentAttendanceRegisterStatus" NOT NULL DEFAULT 'REJECT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "attendance_register_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_attendances" (
    "id" TEXT NOT NULL,
    "attendance_register_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "attendance_register_lecturer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "class_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_attendees" (
    "id" TEXT NOT NULL,
    "class_attendance_id" TEXT NOT NULL,
    "attendance_register_student_id" TEXT NOT NULL,
    "status" "ClassAttendeeStatus" NOT NULL DEFAULT 'ABSENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "class_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crash_course_attendances" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "lecturer_id" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "crash_course_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_registers_course_id_session_key" ON "attendance_registers"("course_id", "session");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_register_lecturers_attendance_register_id_lectur_key" ON "attendance_register_lecturers"("attendance_register_id", "lecturer_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_register_students_attendance_register_id_student_key" ON "attendance_register_students"("attendance_register_id", "student_id");

-- AddForeignKey
ALTER TABLE "attendance_registers" ADD CONSTRAINT "attendance_registers_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_register_lecturers" ADD CONSTRAINT "attendance_register_lecturers_attendance_register_id_fkey" FOREIGN KEY ("attendance_register_id") REFERENCES "attendance_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_register_lecturers" ADD CONSTRAINT "attendance_register_lecturers_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_register_students" ADD CONSTRAINT "attendance_register_students_attendance_register_id_fkey" FOREIGN KEY ("attendance_register_id") REFERENCES "attendance_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_register_students" ADD CONSTRAINT "attendance_register_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_attendances" ADD CONSTRAINT "class_attendances_attendance_register_id_fkey" FOREIGN KEY ("attendance_register_id") REFERENCES "attendance_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_attendances" ADD CONSTRAINT "class_attendances_attendance_register_lecturer_id_fkey" FOREIGN KEY ("attendance_register_lecturer_id") REFERENCES "attendance_register_lecturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_attendees" ADD CONSTRAINT "class_attendees_class_attendance_id_fkey" FOREIGN KEY ("class_attendance_id") REFERENCES "class_attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_attendees" ADD CONSTRAINT "class_attendees_attendance_register_student_id_fkey" FOREIGN KEY ("attendance_register_student_id") REFERENCES "attendance_register_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crash_course_attendances" ADD CONSTRAINT "crash_course_attendances_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crash_course_attendances" ADD CONSTRAINT "crash_course_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crash_course_attendances" ADD CONSTRAINT "crash_course_attendances_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
