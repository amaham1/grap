-- CreateTable
CREATE TABLE `ExternalExhibition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seq` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `categoryName` VARCHAR(191) NULL,
    `cover` VARCHAR(191) NULL,
    `coverThumb` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `hour` VARCHAR(191) NULL,
    `pay` VARCHAR(191) NULL,
    `locs` VARCHAR(191) NULL,
    `locNames` VARCHAR(191) NULL,
    `owner` VARCHAR(191) NULL,
    `tel` VARCHAR(191) NULL,
    `stat` VARCHAR(191) NULL,
    `divName` VARCHAR(191) NULL,
    `intro` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ExternalExhibition_seq_key`(`seq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
