/*
  Warnings:

  - A unique constraint covering the columns `[name,address]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Delivery` DROP FOREIGN KEY `Delivery_rider_id_fkey`;

-- AlterTable
ALTER TABLE `Delivery` MODIFY `rider_id` VARCHAR(50) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Customer_name_address_key` ON `Customer`(`name`, `address`);

-- AddForeignKey
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_rider_id_fkey` FOREIGN KEY (`rider_id`) REFERENCES `Rider`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
