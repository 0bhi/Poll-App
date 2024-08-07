/*
  Warnings:

  - You are about to drop the column `Text` on the `Post` table. All the data in the column will be lost.
  - Added the required column `text` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "Text",
ADD COLUMN     "text" TEXT NOT NULL;
