-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('teacher', 'student');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'student';
