-- CreateEnum
CREATE TYPE "NotificationsType" AS ENUM ('FOLLOW', 'COMMENT', 'UPVOTE', 'VOTE');

-- CreateTable
CREATE TABLE "Notifications" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "NotificationsType" NOT NULL DEFAULT 'VOTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
