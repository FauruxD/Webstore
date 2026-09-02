-- AlterTable
ALTER TABLE `entitlement` ADD COLUMN `fileAssetId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `message` MODIFY `kind` ENUM('TEXT', 'SYSTEM', 'DOWNLOAD', 'ATTACHMENT') NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE `order` ADD COLUMN `deliveryNote` TEXT NULL;

-- CreateTable
CREATE TABLE `MessageAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MessageAttachment_messageId_idx`(`messageId`),
    INDEX `MessageAttachment_fileId_idx`(`fileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Entitlement_fileAssetId_idx` ON `Entitlement`(`fileAssetId`);

-- AddForeignKey
ALTER TABLE `Entitlement` ADD CONSTRAINT `Entitlement_fileAssetId_fkey` FOREIGN KEY (`fileAssetId`) REFERENCES `FileAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageAttachment` ADD CONSTRAINT `MessageAttachment_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageAttachment` ADD CONSTRAINT `MessageAttachment_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `FileAsset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
