/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - Added the required column `type` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'LECTURER', 'STUDENT');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "type" "UserType" NOT NULL;

-- DropEnum
DROP TYPE "UserRole";
