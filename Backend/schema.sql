-- ============================================================
-- Rating Management System - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS rating_management;
USE rating_management;

-- ============================================================
-- Table: users
-- Stores all platform users (admin, normal user, store owner)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  address     VARCHAR(400) NOT NULL,
  role        ENUM('admin', 'user', 'store_owner') NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_email  (email),
  INDEX idx_users_role   (role),
  INDEX idx_users_name   (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: stores
-- Registered stores; each store is linked to a store_owner
-- ============================================================
CREATE TABLE IF NOT EXISTS stores (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  address     VARCHAR(400) NOT NULL,
  owner_id    INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_stores_owner
    FOREIGN KEY (owner_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_stores_name     (name),
  INDEX idx_stores_email    (email),
  INDEX idx_stores_owner_id (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: ratings
-- User ratings for stores (1-5); one rating per user per store
-- ============================================================
CREATE TABLE IF NOT EXISTS ratings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  store_id    INT        NOT NULL,
  user_id     INT        NOT NULL,
  rating      TINYINT    NOT NULL,
  created_at  TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_rating_range CHECK (rating >= 1 AND rating <= 5),

  CONSTRAINT uq_user_store UNIQUE (user_id, store_id),

  CONSTRAINT fk_ratings_store
    FOREIGN KEY (store_id) REFERENCES stores (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_ratings_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_ratings_store_id (store_id),
  INDEX idx_ratings_user_id  (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Seed: Default System Administrator
-- Password: Admin@1234  (bcrypt hash)
-- ============================================================
INSERT IGNORE INTO users (name, email, password, address, role)
VALUES (
  'System Administrator',
  'admin@ratingmanagement.com',
  '$2a$12$QNmCk5Z/LnSviHTqIOpMXuis9WFtED70G0frzS4K3D4jLknrJyj2G', -- Admin@1234
  'System Administration Office, HQ',
  'admin'
);
