-- Add two-factor authentication fields to users table
ALTER TABLE `users` ADD COLUMN `twoFactorCode` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `twoFactorExpiry` DATETIME(3) NULL;
ALTER TABLE `users` ADD COLUMN `twoFactorAttempts` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `users` ADD COLUMN `twoFactorVerifiedAt` DATETIME(3) NULL;
