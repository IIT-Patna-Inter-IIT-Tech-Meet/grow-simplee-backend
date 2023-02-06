/*
  Warnings:

  - Made the column `delivery_id` on table `Inventory_Item` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Inventory_Item` DROP FOREIGN KEY `Inventory_Item_delivery_id_fkey`;

-- DropForeignKey
ALTER TABLE `Pickup` DROP FOREIGN KEY `Pickup_rider_id_fkey`;

-- AlterTable
ALTER TABLE `Inventory_Item` MODIFY `delivery_id` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `Pickup` MODIFY `rider_id` VARCHAR(50) NULL;

-- AddForeignKey
ALTER TABLE `Pickup` ADD CONSTRAINT `Pickup_rider_id_fkey` FOREIGN KEY (`rider_id`) REFERENCES `Rider`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory_Item` ADD CONSTRAINT `Inventory_Item_delivery_id_fkey` FOREIGN KEY (`delivery_id`) REFERENCES `Delivery`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
