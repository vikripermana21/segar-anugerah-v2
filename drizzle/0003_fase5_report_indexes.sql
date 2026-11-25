CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "order_item_order_id_idx" ON "order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_created_idx" ON "order_status_history" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_status_history_status_created_idx" ON "order_status_history" USING btree ("to_status","created_at");