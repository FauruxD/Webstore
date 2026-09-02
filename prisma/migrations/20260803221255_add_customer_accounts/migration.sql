-- CreateTable
CREATE TABLE `CustomerAccount` (
    `id` VARCHAR(191) NOT NULL,
    `emailNormalized` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `customerAccessId` VARCHAR(191) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CustomerAccount_emailNormalized_key`(`emailNormalized`),
    UNIQUE INDEX `CustomerAccount_customerAccessId_key`(`customerAccessId`),
    INDEX `CustomerAccount_lastLoginAt_idx`(`lastLoginAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomerAccount` ADD CONSTRAINT `CustomerAccount_customerAccessId_fkey` FOREIGN KEY (`customerAccessId`) REFERENCES `CustomerAccess`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
