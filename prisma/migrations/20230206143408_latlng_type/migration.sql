/*
  Warnings:

  - You are about to alter the column `latitude` on the `Customer` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Float`.
  - You are about to alter the column `longitude` on the `Customer` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Float`.

*/
-- AlterTable
ALTER TABLE `Customer` MODIFY `latitude` FLOAT NOT NULL,
    MODIFY `longitude` FLOAT NOT NULL;
