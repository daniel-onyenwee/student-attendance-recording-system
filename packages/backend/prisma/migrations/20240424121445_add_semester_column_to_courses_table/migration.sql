/*
  Warnings:

  - Added the required column `semester` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('FIRST', 'SECOND');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "semester" "Semester" NOT NULL;
