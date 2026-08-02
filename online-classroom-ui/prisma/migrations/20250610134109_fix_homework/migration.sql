/*
  Warnings:

  - You are about to drop the column `dueDate` on the `Homework` table. All the data in the column will be lost.
  - Added the required column `attemptNumber` to the `HomeworkSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Homework" DROP COLUMN "dueDate",
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "maxAttempts" INTEGER,
ADD COLUMN     "startTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "HomeworkSubmission" ADD COLUMN     "attemptNumber" INTEGER NOT NULL,
ADD COLUMN     "timeSpent" INTEGER;

-- CreateTable
CREATE TABLE "QuestionAnswer" (
    "id" SERIAL NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "questionId" INTEGER NOT NULL,
    "submissionId" INTEGER NOT NULL,

    CONSTRAINT "QuestionAnswer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuestionAnswer" ADD CONSTRAINT "QuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAnswer" ADD CONSTRAINT "QuestionAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "HomeworkSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
