-- AlterTable
ALTER TABLE `rider` ADD COLUMN `otp` VARCHAR(10) NULL,
    ADD COLUMN `otp_expire_time` DATETIME(3) NULL;
