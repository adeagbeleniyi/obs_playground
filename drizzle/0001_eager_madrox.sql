CREATE TABLE `alert_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdByUserId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`severity` enum('critical','warning','info') NOT NULL DEFAULT 'warning',
	`ruleType` enum('car','locomotive','subdivision','detector','custom') NOT NULL DEFAULT 'custom',
	`condition` text NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`carNumber` varchar(64) NOT NULL,
	`messages` text NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watch_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`watchType` enum('car','wheel','locomotive','train','detector') NOT NULL DEFAULT 'car',
	`target` varchar(256) NOT NULL,
	`condition` text NOT NULL,
	`emailAlert` boolean NOT NULL DEFAULT false,
	`emailAddress` varchar(320),
	`active` boolean NOT NULL DEFAULT true,
	`lastTriggeredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watch_rules_id` PRIMARY KEY(`id`)
);
