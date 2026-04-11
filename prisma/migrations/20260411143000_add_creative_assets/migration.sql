CREATE TABLE `creative_assets` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `secureUrl` VARCHAR(191) NOT NULL,
    `originalFilename` VARCHAR(191) NOT NULL,
    `resourceType` VARCHAR(191) NOT NULL,
    `format` VARCHAR(191) NULL,
    `bytes` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `uploadedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `creative_assets_publicId_key`(`publicId`),
    INDEX `creative_assets_requestId_idx`(`requestId`),
    INDEX `creative_assets_resourceType_idx`(`resourceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `creative_assets`
    ADD CONSTRAINT `creative_assets_requestId_fkey`
    FOREIGN KEY (`requestId`) REFERENCES `creative_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `creative_assets_uploadedById_fkey`
    FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
