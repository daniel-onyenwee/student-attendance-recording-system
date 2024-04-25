/*
  Warnings:

  - You are about to drop the column `name` on the `lecturers` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `students` table. All the data in the column will be lost.
  - Added the required column `other_names` to the `lecturers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surname` to the `lecturers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `other_names` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surname` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "lecturers" DROP COLUMN "name",
ADD COLUMN     "other_names" TEXT NOT NULL,
ADD COLUMN     "surname" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "name",
ADD COLUMN     "other_names" TEXT NOT NULL,
ADD COLUMN     "surname" TEXT NOT NULL;
