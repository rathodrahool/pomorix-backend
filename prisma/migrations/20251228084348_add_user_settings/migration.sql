-- CreateEnum
CREATE TYPE "AlarmSound" AS ENUM ('BELLS', 'DIGITAL', 'BIRD', 'NONE');

-- CreateEnum
CREATE TYPE "TickingSound" AS ENUM ('NONE', 'TICKING_FAST', 'TICKING_SLOW', 'WHITE_NOISE');

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pomodoro_duration" INTEGER NOT NULL DEFAULT 25,
    "short_break" INTEGER NOT NULL DEFAULT 5,
    "long_break" INTEGER NOT NULL DEFAULT 15,
    "alarm_sound" "AlarmSound" NOT NULL DEFAULT 'BELLS',
    "ticking_sound" "TickingSound" NOT NULL DEFAULT 'NONE',
    "volume" INTEGER NOT NULL DEFAULT 50,
    "auto_start_breaks" BOOLEAN NOT NULL DEFAULT false,
    "auto_start_pomodoros" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_settings_user_id_idx" ON "user_settings"("user_id");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
