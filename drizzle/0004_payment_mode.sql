CREATE TYPE "public"."payment_mode" AS ENUM('whatsapp', 'midtrans');--> statement-breakpoint
ALTER TABLE "store_setting" ADD COLUMN "payment_mode" "payment_mode" DEFAULT 'whatsapp' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_setting" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "store_setting" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "store_setting" ADD COLUMN "bank_account_name" text;