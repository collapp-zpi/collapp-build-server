/*
  Warnings:

  - You are about to drop the column `image` on the `AdminUser` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `AdminUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AdminUser" DROP COLUMN "image",
DROP COLUMN "name";
