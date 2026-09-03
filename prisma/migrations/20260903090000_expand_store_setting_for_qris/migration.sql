-- A QRIS image is a single small store-level asset. Persisting it in MySQL keeps
-- the setting available across server restarts and deployments without relying
-- on an ephemeral local filesystem.
ALTER TABLE `StoreSetting` MODIFY `value` LONGTEXT NOT NULL;
