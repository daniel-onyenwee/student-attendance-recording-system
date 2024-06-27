/*
  Warnings:

  - You are about to drop the column `classSize` on the `class_locations` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ClassShape" AS ENUM ('CIRCLE', 'SQUARE');

-- AlterTable
ALTER TABLE "class_locations" DROP COLUMN "classSize",
ADD COLUMN     "class_shape" "ClassShape" NOT NULL DEFAULT 'SQUARE',
ADD COLUMN     "class_size" "ClassSize" NOT NULL DEFAULT 'MEDIUM';
