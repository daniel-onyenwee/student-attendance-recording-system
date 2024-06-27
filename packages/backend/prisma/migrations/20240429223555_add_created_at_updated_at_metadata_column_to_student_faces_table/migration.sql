/*
  Warnings:

  - Added the required column `updated_at` to the `student_faces` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "student_faces" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
