ALTER TABLE `social_media_plans`
    ADD COLUMN `clientName` VARCHAR(191) NULL;

CREATE INDEX `social_media_plans_clientName_idx` ON `social_media_plans`(`clientName`);
