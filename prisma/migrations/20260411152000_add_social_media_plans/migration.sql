CREATE TABLE `social_media_plans` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NULL,
    `campaignName` VARCHAR(191) NULL,
    `scheduledFor` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'planned',
    `captionHtml` TEXT NULL,
    `adCopyHtml` TEXT NULL,
    `briefHtml` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `social_media_plans_scheduledFor_idx`(`scheduledFor`),
    INDEX `social_media_plans_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `creative_requests`
    ADD COLUMN `socialMediaPlanId` VARCHAR(191) NULL,
    ADD COLUMN `socialMediaPlanTitle` VARCHAR(191) NULL,
    ADD COLUMN `socialMediaCaptionHtml` TEXT NULL,
    ADD COLUMN `socialMediaAdCopyHtml` TEXT NULL;

CREATE INDEX `creative_requests_socialMediaPlanId_idx` ON `creative_requests`(`socialMediaPlanId`);

ALTER TABLE `social_media_plans`
    ADD CONSTRAINT `social_media_plans_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `creative_requests`
    ADD CONSTRAINT `creative_requests_socialMediaPlanId_fkey`
    FOREIGN KEY (`socialMediaPlanId`) REFERENCES `social_media_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
