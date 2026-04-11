ALTER TABLE `users`
    ADD COLUMN `createdById` VARCHAR(191) NULL;

CREATE TABLE `creative_requests` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `requestDate` DATETIME(3) NOT NULL,
    `requesterName` VARCHAR(191) NOT NULL,
    `requesterFunction` VARCHAR(191) NULL,
    `servicePole` VARCHAR(191) NULL,
    `clientName` VARCHAR(191) NULL,
    `accountManager` VARCHAR(191) NULL,
    `clientApproverContact` VARCHAR(191) NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NULL,
    `objective` VARCHAR(191) NULL,
    `campaignName` VARCHAR(191) NULL,
    `mainMessage` TEXT NULL,
    `callToAction` VARCHAR(191) NULL,
    `copyProvided` BOOLEAN NOT NULL DEFAULT false,
    `copywriterName` VARCHAR(191) NULL,
    `desiredFormat` VARCHAR(191) NULL,
    `quantity` INTEGER NULL,
    `language` VARCHAR(191) NULL,
    `includeLogo` BOOLEAN NOT NULL DEFAULT false,
    `brandGuidelinesProvided` BOOLEAN NOT NULL DEFAULT false,
    `priceToDisplay` VARCHAR(191) NULL,
    `dateToDisplay` VARCHAR(191) NULL,
    `timeToDisplay` VARCHAR(191) NULL,
    `locationToDisplay` VARCHAR(191) NULL,
    `contactNumber` VARCHAR(191) NULL,
    `linkUrl` VARCHAR(191) NULL,
    `hashtags` TEXT NULL,
    `legalMentions` TEXT NULL,
    `partnersSponsors` VARCHAR(191) NULL,
    `mandatoryElements` TEXT NULL,
    `photosAvailable` BOOLEAN NOT NULL DEFAULT false,
    `videosAvailable` BOOLEAN NOT NULL DEFAULT false,
    `logoAvailable` BOOLEAN NOT NULL DEFAULT false,
    `sourceTextAvailable` BOOLEAN NOT NULL DEFAULT false,
    `visualReferences` TEXT NULL,
    `referenceLinks` TEXT NULL,
    `assetLocation` VARCHAR(191) NULL,
    `creativeDueDate` DATETIME(3) NULL,
    `publicationDate` DATETIME(3) NULL,
    `publicationTime` VARCHAR(191) NULL,
    `urgency` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `validationRequired` VARCHAR(191) NOT NULL DEFAULT 'internal_only',
    `feedbackRounds` INTEGER NULL,
    `requesterValidation` VARCHAR(191) NULL,
    `marketingValidation` VARCHAR(191) NULL,
    `clientValidation` VARCHAR(191) NULL,
    `finalValidation` VARCHAR(191) NULL,
    `additionalNotes` TEXT NULL,
    `workflowStatus` VARCHAR(191) NOT NULL DEFAULT 'brief_received',
    `workflowResponsible` VARCHAR(191) NULL,
    `workflowDate` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `assignedToId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `creative_requests_reference_key`(`reference`),
    INDEX `creative_requests_publicationDate_idx`(`publicationDate`),
    INDEX `creative_requests_workflowStatus_idx`(`workflowStatus`),
    INDEX `creative_requests_assignedToId_idx`(`assignedToId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `creative_deliverables` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NULL,
    `format` VARCHAR(191) NULL,
    `scheduledFor` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'planned',
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `creative_deliverables_scheduledFor_idx`(`scheduledFor`),
    INDEX `creative_deliverables_status_idx`(`status`),
    INDEX `creative_deliverables_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `users`
    ADD CONSTRAINT `users_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `creative_requests`
    ADD CONSTRAINT `creative_requests_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `creative_requests_assignedToId_fkey`
    FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `creative_deliverables`
    ADD CONSTRAINT `creative_deliverables_requestId_fkey`
    FOREIGN KEY (`requestId`) REFERENCES `creative_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `creative_deliverables_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `creative_deliverables_ownerId_fkey`
    FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
