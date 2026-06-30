-- Database and user are created automatically by MariaDB container
-- via MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD env vars.
-- This script only creates tables and grants permissions.

USE mydb;

CREATE TABLE IF NOT EXISTS disability_types (
  id INT NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(10) DEFAULT '❓',
  gradient VARCHAR(255) DEFAULT '',
  bg_color VARCHAR(255) DEFAULT '',
  text_color VARCHAR(255) DEFAULT '',
  border_color VARCHAR(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessment_dimensions (
  id INT NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(10) DEFAULT '❓',
  gradient VARCHAR(255) DEFAULT '',
  bg_color VARCHAR(255) DEFAULT '',
  text_color VARCHAR(255) DEFAULT '',
  border_color VARCHAR(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
