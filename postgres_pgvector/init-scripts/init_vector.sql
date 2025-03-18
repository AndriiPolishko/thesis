-- Create a new database for pgvector usage.
CREATE DATABASE vector_db;

-- Connect to the new database and install the extension.
\connect vector_db
CREATE EXTENSION IF NOT EXISTS vector;
