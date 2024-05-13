/*
  Warnings:

  - Added the required column `status` to the `class_attendances` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClassAttendanceStatus" AS ENUM ('ONGOING', 'REVIEWING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ClassSize" AS ENUM ('EXTRA_SMALL', 'SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE');

-- AlterTable
ALTER TABLE "class_attendances" ADD COLUMN     "status" "ClassAttendanceStatus" NOT NULL;

-- CreateTable
CREATE TABLE "class_locations" (
    "id" TEXT NOT NULL,
    "class_attendance_id" TEXT NOT NULL,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,
    "classSize" "ClassSize" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "class_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_locations_class_attendance_id_key" ON "class_locations"("class_attendance_id");

-- AddForeignKey
ALTER TABLE "class_locations" ADD CONSTRAINT "class_locations_class_attendance_id_fkey" FOREIGN KEY ("class_attendance_id") REFERENCES "class_attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
