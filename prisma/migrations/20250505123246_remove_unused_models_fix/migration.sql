-- CreateTable
CREATE TABLE `admin_user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `external_exhibition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seq` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `categoryName` VARCHAR(191) NULL,
    `cover` VARCHAR(191) NULL,
    `coverThumb` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `hour` TEXT NULL,
    `pay` TEXT NULL,
    `locs` VARCHAR(191) NULL,
    `locNames` VARCHAR(191) NULL,
    `owner` VARCHAR(191) NULL,
    `tel` VARCHAR(191) NULL,
    `stat` VARCHAR(191) NULL,
    `divName` VARCHAR(191) NULL,
    `intro` TEXT NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `external_exhibition_seq_key`(`seq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `welfare_service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seq` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `all_loc` BOOLEAN NOT NULL,
    `jeju_loc` BOOLEAN NOT NULL,
    `seogwipo_loc` BOOLEAN NOT NULL,
    `support` TEXT NULL,
    `contents` TEXT NULL,
    `application` TEXT NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `welfare_service_seq_key`(`seq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jeju_event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seq` INTEGER NOT NULL,
    `no` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `write_date` DATETIME(3) NOT NULL,
    `writer` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `contents` TEXT NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `jeju_event_seq_key`(`seq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `external_event_jejunolda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `apiSeq` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `time` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `host` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `content` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `categoryName` VARCHAR(191) NULL,
    `payName` VARCHAR(191) NULL,
    `locName` VARCHAR(191) NULL,
    `intro` TEXT NULL,
    `cover` VARCHAR(191) NULL,
    `coverThumb` VARCHAR(191) NULL,
    `instituteName` VARCHAR(191) NULL,
    `tel` VARCHAR(191) NULL,
    `addr1` VARCHAR(191) NULL,
    `addr2` VARCHAR(191) NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `external_event_jejunolda_apiSeq_key`(`apiSeq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_sync_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `apiIdentifier` VARCHAR(191) NOT NULL,
    `lastPageFetched` INTEGER NULL,
    `lastSyncTime` DATETIME(3) NOT NULL,

    UNIQUE INDEX `api_sync_status_apiIdentifier_key`(`apiIdentifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
