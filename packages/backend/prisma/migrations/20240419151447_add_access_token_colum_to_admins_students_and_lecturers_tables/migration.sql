/*
  Warnings:

  - A unique constraint covering the columns `[access_token]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[access_token]` on the table `lecturers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[access_token]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `access_token` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `access_token` to the `lecturers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `access_token` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "access_token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lecturers" ADD COLUMN     "access_token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "access_token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admins_access_token_key" ON "admins"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_access_token_key" ON "lecturers"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "students_access_token_key" ON "students"("access_token");
