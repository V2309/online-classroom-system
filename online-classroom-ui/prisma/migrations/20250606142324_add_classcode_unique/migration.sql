/*
  Warnings:

  - A unique constraint covering the columns `[class_code]` on the table `Class` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Class_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Class_class_code_key" ON "Class"("class_code");
