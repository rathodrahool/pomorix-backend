-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "completed_pomodoros" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimated_pomodoros" INTEGER,
ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false;
