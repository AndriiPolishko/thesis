-- ENUM TYPES

CREATE TYPE event_type AS ENUM ('outgoing', 'incoming', 'closed', 'booked', 'reply', 'opt-out');
CREATE TYPE campaign_lead_status AS ENUM ('new', 'engaged', 'booked', 'closed');
CREATE TYPE link_status AS ENUM ('pending', 'scrapped', 'error');
CREATE TYPE campaign_status AS ENUM ('pending', 'inactive', 'active');
CREATE TYPE lead_status AS ENUM ('active', 'opt-out')

-- TABLES

CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE integration_token (
    id SERIAL PRIMARY KEY,
    email TEXT,
    access_token TEXT,
    refresh_token TEXT,
    history_id TEXT,
    webhook_expires_At TIMESTAMPTZ,
    user_id INTEGER REFERENCES "user"(id),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE campaign (
    id SERIAL PRIMARY KEY,
    name TEXT,
    goal TEXT,
    user_id INTEGER REFERENCES "user"(id),
    status campaign_status,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE lead (
    id SERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    status lead_status
    user_id INTEGER REFERENCES "user"(id),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE campaign_lead (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES lead(id),
    campaign_id INTEGER REFERENCES campaign(id),
    status campaign_lead_status,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE link (
    id SERIAL PRIMARY KEY,
    url TEXT,
    campaign_id INTEGER REFERENCES campaign(id),
    content_hash TEXT,
    status link_status,
    last_scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE event (
    id SERIAL PRIMARY KEY,
    "from" TEXT,
    "to" TEXT,
    "type" event_type,
    body TEXT,
    "subject" TEXT,
    thread_id TEXT,
    lead_id INTEGER REFERENCES lead(id),
    campaign_id INTEGER REFERENCES campaign(id),
    campaign_lead_id INTEGER REFERENCES campaign_lead(id),
    message_id TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE chunk (
  id           SERIAL PRIMARY KEY,
  chunk_hash   TEXT    NOT NULL,
  chunk        TEXT    NOT NULL,
  embedding    VECTOR,
  text_search_vector TSVECTOR,
  link_id      INTEGER,
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ,
);