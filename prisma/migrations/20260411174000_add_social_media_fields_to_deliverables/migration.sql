ALTER TABLE `creative_deliverables`
    ADD COLUMN `socialMediaPlanId` VARCHAR(191) NULL,
    ADD COLUMN `socialMediaPlanTitle` VARCHAR(191) NULL,
    ADD COLUMN `socialMediaCaptionHtml` TEXT NULL,
    ADD COLUMN `socialMediaAdCopyHtml` TEXT NULL;

CREATE INDEX `creative_deliverables_socialMediaPlanId_idx` ON `creative_deliverables`(`socialMediaPlanId`);

ALTER TABLE `creative_deliverables`
    ADD CONSTRAINT `creative_deliverables_socialMediaPlanId_fkey`
    FOREIGN KEY (`socialMediaPlanId`) REFERENCES `social_media_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
