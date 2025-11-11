-- =========================================
-- BASE DE DATOS: supercms_eventos
-- ESTRUCTURA BASE - v1.1 (11-nov-2025)
-- =========================================

CREATE DATABASE IF NOT EXISTS supercms_eventos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE supercms_eventos;

-- =========================================
-- 1️⃣ TABLA: SAADMIN (Super Administradores)
-- =========================================
CREATE TABLE saadmins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- 2️⃣ TABLA: ADMINS (Administradores de eventos)
-- =========================================
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- 3️⃣ TABLA: USUARIOS (Participantes)
-- =========================================
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(20) UNIQUE NOT NULL,
  nombres VARCHAR(150) NOT NULL,
  apellidos VARCHAR(150) NOT NULL,
  correo_corporativo VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(30),
  empresa VARCHAR(150),
  password_hash VARCHAR(255),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- 4️⃣ TABLA: EVENTOS
-- =========================================
CREATE TABLE eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL, -- ejemplo: "tradex-2025"
  descripcion TEXT,
  logo_url VARCHAR(255),
  banner_url VARCHAR(255),
  branding_json JSON,                -- guarda colores, fuentes, estilos personalizados
  plantilla VARCHAR(100) DEFAULT 'default',
  activo BOOLEAN DEFAULT TRUE,
  fecha_inicio DATE,
  fecha_fin DATE,
  creado_por INT,
  FOREIGN KEY (creado_por) REFERENCES saadmins(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- 5️⃣ TABLA: EVENTOS_ADMINS (asignación admin ↔ evento)
-- =========================================
CREATE TABLE eventos_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NOT NULL,
  admin_id INT NOT NULL,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  UNIQUE (evento_id, admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- 6️⃣ TABLA: REGISTRO_EVENTOS (usuarios ↔ eventos)
-- =========================================
CREATE TABLE registro_eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NOT NULL,
  usuario_id INT NOT NULL,
  intent_number INT DEFAULT 1,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_confirmacion DATETIME NULL,
  fecha_asistencia DATETIME NULL,
  estado ENUM('registrado', 'confirmado', 'asistio') DEFAULT 'registrado',
  qr_code VARCHAR(100) UNIQUE DEFAULT NULL,
  password VARCHAR(255) NULL,
  qr_code_url VARCHAR(255) NULL,
  qr_image LONGBLOB NULL,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_evento_usuario (evento_id, usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- 7️⃣ TABLA: LOGS (auditoría del sistema)
-- =========================================
CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_tipo ENUM('saadmin','admin','usuario') NOT NULL,
  actor_id INT NOT NULL,
  accion VARCHAR(255) NOT NULL,
  detalle TEXT,
  ip_address VARCHAR(100),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- INDICES ADICIONALES
-- =========================================
CREATE INDEX idx_evento_slug ON eventos(slug);
CREATE INDEX idx_registro_estado ON registro_eventos(estado);
CREATE INDEX idx_usuario_email ON usuarios(correo_corporativo);
CREATE INDEX idx_admin_email ON admins(email);
