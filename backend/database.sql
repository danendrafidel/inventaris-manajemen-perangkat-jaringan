-- Create offices table
CREATE TABLE IF NOT EXISTS offices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add office_id to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'office_id') THEN
        ALTER TABLE users ADD COLUMN office_id INTEGER REFERENCES offices(id);
    END IF;
END $$;
