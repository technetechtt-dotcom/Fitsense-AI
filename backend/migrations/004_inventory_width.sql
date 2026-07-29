-- Inventory width fittings (UK D / EE etc.) for school/retail stock rows.
-- Existing rows default to width_label = 'standard'.

ALTER TABLE catalogue_inventory
  ADD COLUMN IF NOT EXISTS width_label text NOT NULL DEFAULT 'standard';

ALTER TABLE catalogue_inventory
  DROP CONSTRAINT IF EXISTS catalogue_inventory_pkey;

ALTER TABLE catalogue_inventory
  ADD PRIMARY KEY (org_id, product_id, size_system, size_label, width_label);
