/*
  Warnings:

  - You are about to drop the column `access_token` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `access_token` on the `lecturers` table. All the data in the column will be lost.
  - You are about to drop the column `access_token` on the `students` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'LECTURER', 'STUDENT');

-- DropIndex
DROP INDEX "admins_access_token_key";

-- DropIndex
DROP INDEX "lecturers_access_token_key";

-- DropIndex
DROP INDEX "students_access_token_key";

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "access_token";

-- AlterTable
ALTER TABLE "lecturers" DROP COLUMN "access_token";

-- AlterTable
ALTER TABLE "students" DROP COLUMN "access_token";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "access_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_access_token_key" ON "users"("access_token");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
