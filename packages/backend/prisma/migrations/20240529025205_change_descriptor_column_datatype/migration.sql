-- AlterTable
ALTER TABLE "student_faces" ALTER COLUMN "descriptor" SET NOT NULL,
ALTER COLUMN "descriptor" DROP DEFAULT,
ALTER COLUMN "descriptor" SET DATA TYPE TEXT;
