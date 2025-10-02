-- Create payment_links table
CREATE TABLE IF NOT EXISTS payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    link_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255),
    description TEXT,
    amount DECIMAL(18,6) NOT NULL,
    expiration_type VARCHAR(20) NOT NULL CHECK (expiration_type IN ('one-time', 'time-based', 'public')),
    expires_at TIMESTAMP,
    custom_fields JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    max_uses INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_payment_links_creator_id ON payment_links(creator_id);
CREATE INDEX idx_payment_links_link_id ON payment_links(link_id);
CREATE INDEX idx_payment_links_active ON payment_links(is_active);
