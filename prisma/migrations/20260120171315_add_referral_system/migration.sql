-- Add referral fields to users table
ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `referralCode` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `walletBalance` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `users` ADD UNIQUE INDEX `users_referralCode_key`(`referralCode`);

-- Create promotions table
CREATE TABLE `promotions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `rewardAmount` INTEGER NOT NULL,
    `discountPercent` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create leads table
CREATE TABLE `leads` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `referrerId` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `convertedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraints
ALTER TABLE `leads` ADD CONSTRAINT `leads_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `leads` ADD CONSTRAINT `leads_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
