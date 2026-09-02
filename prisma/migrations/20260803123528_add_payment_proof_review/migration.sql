-- AlterTable
ALTER TABLE `paymentproof` ADD COLUMN `rejectionReason` TEXT NULL,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL;
