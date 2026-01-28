-- Migration: Add direct messages (1-to-1 chat)
-- Date: 2026-01-28
-- Description: Adds tables for private messaging between players

-- Create direct_conversations table
CREATE TABLE IF NOT EXISTS direct_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Participants (stored with participant1_id < participant2_id for uniqueness)
    participant1_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Last message info for display in conversation list
    last_message_at TIMESTAMP,
    last_message_preview VARCHAR(100),
    
    -- Unread counters per participant
    unread_count_1 INTEGER DEFAULT 0 NOT NULL, -- Unread for participant1
    unread_count_2 INTEGER DEFAULT 0 NOT NULL, -- Unread for participant2
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Ensure participant1_id < participant2_id
    CONSTRAINT participant_order CHECK (participant1_id < participant2_id)
);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    
    -- Read status
    read_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for direct_conversations
CREATE INDEX IF NOT EXISTS direct_conversations_participant1_idx 
    ON direct_conversations(participant1_id);
CREATE INDEX IF NOT EXISTS direct_conversations_participant2_idx 
    ON direct_conversations(participant2_id);
CREATE UNIQUE INDEX IF NOT EXISTS direct_conversations_unique_participants 
    ON direct_conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS direct_conversations_last_message_at_idx 
    ON direct_conversations(last_message_at DESC);

-- Create indexes for direct_messages
CREATE INDEX IF NOT EXISTS direct_messages_conversation_id_idx 
    ON direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS direct_messages_sender_id_idx 
    ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS direct_messages_created_at_idx 
    ON direct_messages(created_at DESC);

-- Add comments
COMMENT ON TABLE direct_conversations IS 'Private conversations between two players';
COMMENT ON TABLE direct_messages IS 'Messages in direct conversations';
COMMENT ON COLUMN direct_conversations.unread_count_1 IS 'Number of unread messages for participant1';
COMMENT ON COLUMN direct_conversations.unread_count_2 IS 'Number of unread messages for participant2';
