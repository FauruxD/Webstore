-- Preserve the existing CustomerAccount rows while making the table the shared
-- source of credentials for customers and admins.
ALTER TABLE `CustomerAccount`
  DROP FOREIGN KEY `CustomerAccount_customerAccessId_fkey`;

ALTER TABLE `CustomerAccount`
  ADD COLUMN `role` ENUM('CUSTOMER', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'CUSTOMER',
  ADD COLUMN `adminUserId` VARCHAR(191) NULL,
  MODIFY `customerAccessId` VARCHAR(191) NULL;

-- Copy every existing admin credential into the shared account table. If the same
-- email already owns a customer account, the admin identity wins and the historical
-- CustomerAccess row remains intact as guest/order history instead of being deleted.
INSERT INTO `CustomerAccount` (
  `id`,
  `emailNormalized`,
  `passwordHash`,
  `role`,
  `customerAccessId`,
  `adminUserId`,
  `lastLoginAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  UUID(),
  LOWER(TRIM(`email`)),
  `passwordHash`,
  CASE WHEN `role` = 'SUPERADMIN' THEN 'SUPERADMIN' ELSE 'ADMIN' END,
  NULL,
  `id`,
  NULL,
  `createdAt`,
  `updatedAt`
FROM `AdminUser`
ON DUPLICATE KEY UPDATE
  `passwordHash` = VALUES(`passwordHash`),
  `role` = VALUES(`role`),
  `customerAccessId` = NULL,
  `adminUserId` = VALUES(`adminUserId`),
  `updatedAt` = VALUES(`updatedAt`);

CREATE UNIQUE INDEX `CustomerAccount_adminUserId_key` ON `CustomerAccount`(`adminUserId`);
CREATE INDEX `CustomerAccount_role_idx` ON `CustomerAccount`(`role`);

ALTER TABLE `CustomerAccount`
  ADD CONSTRAINT `CustomerAccount_customerAccessId_fkey`
    FOREIGN KEY (`customerAccessId`) REFERENCES `CustomerAccess`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `CustomerAccount_adminUserId_fkey`
    FOREIGN KEY (`adminUserId`) REFERENCES `AdminUser`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Credentials and authorization now live only on Account. AdminUser remains the
-- operational profile used by audit logs and admin-facing metadata.
ALTER TABLE `AdminUser`
  DROP COLUMN `passwordHash`,
  DROP COLUMN `role`;
