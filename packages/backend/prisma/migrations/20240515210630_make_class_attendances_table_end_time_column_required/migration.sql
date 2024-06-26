/*
  Warnings:

  - Made the column `end_time` on table `class_attendances` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "class_attendances" ALTER COLUMN "end_time" SET NOT NULL;
