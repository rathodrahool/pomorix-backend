/*
  Warnings:

  - You are about to drop the column `break_duration_seconds` on the `pomodoro_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `focus_duration_seconds` on the `pomodoro_sessions` table. All the data in the column will be lost.
  - Added the required column `duration_seconds` to the `pomodoro_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_type` to the `pomodoro_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('FOCUS', 'SHORT_BREAK', 'LONG_BREAK');

-- AlterTable
ALTER TABLE "pomodoro_sessions" DROP COLUMN "break_duration_seconds",
DROP COLUMN "focus_duration_seconds",
ADD COLUMN     "duration_seconds" INTEGER NOT NULL,
ADD COLUMN     "session_type" "SessionType" NOT NULL;
