/*
  Warnings:

  - Added the required column `breadth` to the `Archived_Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `Archived_Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `length` to the `Archived_Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `Archived_Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `breadth` to the `Inventory_Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `Inventory_Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `length` to the `Inventory_Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `Inventory_Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Inventory_Item` DROP FOREIGN KEY `Inventory_Item_delivery_id_fkey`;

-- AlterTable
ALTER TABLE `Archived_Item` ADD COLUMN `breadth` FLOAT NOT NULL,
    ADD COLUMN `height` FLOAT NOT NULL,
    ADD COLUMN `length` FLOAT NOT NULL,
    ADD COLUMN `weight` FLOAT NOT NULL;

-- AlterTable
ALTER TABLE `Inventory_Item` ADD COLUMN `breadth` FLOAT NOT NULL,
    ADD COLUMN `height` FLOAT NOT NULL,
    ADD COLUMN `length` FLOAT NOT NULL,
    ADD COLUMN `weight` FLOAT NOT NULL,
    MODIFY `delivery_id` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `Product` MODIFY `density` FLOAT NULL;

-- AddForeignKey
ALTER TABLE `Inventory_Item` ADD CONSTRAINT `Inventory_Item_delivery_id_fkey` FOREIGN KEY (`delivery_id`) REFERENCES `Delivery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
