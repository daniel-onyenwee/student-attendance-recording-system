-- AlterTable
ALTER TABLE "student_faces" ADD COLUMN     "descriptor" DECIMAL(65,30)[] DEFAULT ARRAY[]::DECIMAL(65,30)[];
