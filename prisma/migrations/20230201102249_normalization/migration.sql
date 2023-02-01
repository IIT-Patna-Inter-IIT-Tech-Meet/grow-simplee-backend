/*
  Warnings:

  - You are about to drop the column `item_id` on the `delivery` table. All the data in the column will be lost.
  - You are about to drop the column `item_id` on the `pickup` table. All the data in the column will be lost.
  - You are about to drop the `archive` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `AWB` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `EDD` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `AWB` to the `Pickup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `EDP` to the `Pickup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `Pickup` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `archive` DROP FOREIGN KEY `Archive_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `archive` DROP FOREIGN KEY `Archive_delivery_id_fkey`;

-- DropForeignKey
ALTER TABLE `archive` DROP FOREIGN KEY `Archive_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `delivery` DROP FOREIGN KEY `Delivery_item_id_fkey`;

-- DropForeignKey
ALTER TABLE `inventory` DROP FOREIGN KEY `Inventory_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `inventory` DROP FOREIGN KEY `Inventory_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `pickup` DROP FOREIGN KEY `Pickup_item_id_fkey`;

-- AlterTable
ALTER TABLE `delivery` DROP COLUMN `item_id`,
    ADD COLUMN `AWB` VARCHAR(50) NOT NULL,
    ADD COLUMN `EDD` DATETIME(3) NOT NULL,
    ADD COLUMN `delivery_timestamp` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `pickup` DROP COLUMN `item_id`,
    ADD COLUMN `AWB` VARCHAR(50) NOT NULL,
    ADD COLUMN `EDP` DATETIME(3) NOT NULL,
    ADD COLUMN `pickup_timestamp` DATETIME(3) NULL,
    ADD COLUMN `product_id` VARCHAR(50) NOT NULL;

-- DropTable
DROP TABLE `archive`;

-- DropTable
DROP TABLE `inventory`;

-- CreateTable
CREATE TABLE `Inventory_Item` (
    `id` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `product_id` VARCHAR(50) NOT NULL,
    `shipped` BOOLEAN NOT NULL,
    `delivery_id` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Archived_Delivery` (
    `id` VARCHAR(20) NOT NULL,
    `EDD` DATETIME(3) NOT NULL,
    `AWB` VARCHAR(50) NOT NULL,
    `delivery_timestamp` DATETIME(3) NOT NULL,
    `rider_id` VARCHAR(50) NOT NULL,
    `customer_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Archived_Pickup` (
    `id` VARCHAR(20) NOT NULL,
    `EDP` DATETIME(3) NOT NULL,
    `pickup_timestamp` DATETIME(3) NULL,
    `AWB` VARCHAR(50) NOT NULL,
    `rider_id` VARCHAR(50) NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `product_id` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Archived_Item` (
    `id` VARCHAR(50) NOT NULL,
    `product_id` VARCHAR(50) NOT NULL,
    `delivery_id` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pickup` ADD CONSTRAINT `Pickup_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`SKU`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory_Item` ADD CONSTRAINT `Inventory_Item_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`SKU`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory_Item` ADD CONSTRAINT `Inventory_Item_delivery_id_fkey` FOREIGN KEY (`delivery_id`) REFERENCES `Delivery`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archived_Delivery` ADD CONSTRAINT `Archived_Delivery_rider_id_fkey` FOREIGN KEY (`rider_id`) REFERENCES `Rider`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archived_Delivery` ADD CONSTRAINT `Archived_Delivery_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archived_Pickup` ADD CONSTRAINT `Archived_Pickup_rider_id_fkey` FOREIGN KEY (`rider_id`) REFERENCES `Rider`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archived_Pickup` ADD CONSTRAINT `Archived_Pickup_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archived_Pickup` ADD CONSTRAINT `Archived_Pickup_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`SKU`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archived_Item` ADD CONSTRAINT `Archived_Item_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`SKU`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archived_Item` ADD CONSTRAINT `Archived_Item_delivery_id_fkey` FOREIGN KEY (`delivery_id`) REFERENCES `Archived_Delivery`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
