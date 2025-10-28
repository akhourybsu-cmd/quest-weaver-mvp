-- Make holdings.item_id nullable so we can unlink items from holdings
ALTER TABLE public.holdings 
ALTER COLUMN item_id DROP NOT NULL;

-- Change holding_events foreign key to CASCADE on delete
-- so holding_events are automatically deleted when items are deleted
ALTER TABLE public.holding_events
DROP CONSTRAINT holding_events_item_id_fkey,
ADD CONSTRAINT holding_events_item_id_fkey 
  FOREIGN KEY (item_id) 
  REFERENCES public.items(id) 
  ON DELETE CASCADE;