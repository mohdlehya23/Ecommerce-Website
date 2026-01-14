-- Add missing updated_at column to sellers table
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sellers_updated_at ON sellers;
CREATE TRIGGER update_sellers_updated_at
    BEFORE UPDATE ON sellers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
