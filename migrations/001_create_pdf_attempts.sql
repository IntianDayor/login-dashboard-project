CREATE TABLE IF NOT EXISTS pdf_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    last_attempt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pdf_ip (ip_address)
);

