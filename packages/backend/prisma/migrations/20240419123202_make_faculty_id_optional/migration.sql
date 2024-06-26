-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_faculty_id_fkey";

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "faculty_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
