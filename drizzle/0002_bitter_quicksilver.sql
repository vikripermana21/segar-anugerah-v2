ALTER TABLE "orders" ADD COLUMN "snap_token" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "snap_redirect_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "snap_created_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "orders_customer_status_idx" ON "orders" USING btree ("customer_id","status");