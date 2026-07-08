CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE products ADD COLUMN IF NOT EXISTS product_brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price_ttc DECIMAL(15, 3) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_badge TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_specs TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_gallery_urls TEXT;

CREATE TABLE IF NOT EXISTS web_product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_title TEXT,
    comment TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_product_reviews_product
ON web_product_reviews(product_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE web_product_reviews TO anon, authenticated;

ALTER TABLE web_product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS web_product_reviews_anon_all ON web_product_reviews;

CREATE POLICY web_product_reviews_anon_all ON web_product_reviews
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
