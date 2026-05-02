-- NeuroScan Database Schema
-- Migration: 001_initial_schema.sql
-- Run automatically by PostgreSQL on first start

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS 

CREATE TYPE user_role AS ENUM ('doctor', 'patient');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE mri_status AS ENUM ('pending', 'processing', 'analyzed', 'reviewed', 'completed', 'cancelled');
CREATE TYPE tumor_class AS ENUM ('glioma', 'meningioma', 'pituitary', 'no_tumor');
CREATE TYPE notification_type AS ENUM (
  'connection_request_sent',
  'connection_request_accepted',
  'connection_request_rejected',
  'mri_uploaded',
  'mri_processing_started',
  'ai_analysis_complete',
  'diagnosis_ready',
  'report_available',
  'doctor_assigned',
  'account_created_for_you'
);

-- USERS

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(20),
  date_of_birth DATE,
  gender        VARCHAR(10),
  address       TEXT,
  avatar_url    VARCHAR(500),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- DOCTORS 

CREATE TABLE doctors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medical_id      VARCHAR(100) UNIQUE NOT NULL,
  specialty       VARCHAR(150) NOT NULL,
  hospital        VARCHAR(200),
  department      VARCHAR(150),
  years_exp       INTEGER DEFAULT 0,
  bio             TEXT,
  consultation_fee DECIMAL(10,2),
  available       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- PATIENTS

CREATE TABLE patients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_code    VARCHAR(50) UNIQUE,
  blood_type      VARCHAR(5),
  allergies       TEXT[],
  medical_history TEXT,
  emergency_contact_name  VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  insurance_number VARCHAR(100),
  assigned_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- DOCTOR-PATIENT LINK REQUESTS 

CREATE TABLE link_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_role user_role NOT NULL,
  status        request_status DEFAULT 'pending',
  message       TEXT,
  responded_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, target_id)
);

-- MRI SCANS 

CREATE TABLE mri_scans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path       VARCHAR(500) NOT NULL,
  file_size       BIGINT NOT NULL,
  file_type       VARCHAR(20) NOT NULL,
  scan_date       DATE,
  scan_type       VARCHAR(100) DEFAULT 'Brain MRI',
  body_part       VARCHAR(50) DEFAULT 'Brain',
  notes           TEXT,
  status          mri_status DEFAULT 'pending',
  thumbnail_path  VARCHAR(500),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- AI ANALYSIS RESULTS 

CREATE TABLE ai_analyses (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mri_scan_id         UUID NOT NULL REFERENCES mri_scans(id) ON DELETE CASCADE,
  predicted_class     tumor_class,
  confidence          DECIMAL(5,2),
  segmentation_mask_path VARCHAR(500),
  raw_output          JSONB,
  inference_version   VARCHAR(50) DEFAULT 'placeholder-v1.0',
  processing_time_ms  INTEGER,
  processed_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- DIAGNOSES 

CREATE TABLE diagnoses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mri_scan_id     UUID NOT NULL REFERENCES mri_scans(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  ai_analysis_id  UUID REFERENCES ai_analyses(id),
  findings        TEXT NOT NULL,
  conclusion      TEXT NOT NULL,
  recommendations TEXT,
  follow_up_date  DATE,
  is_shared_with_patient BOOLEAN DEFAULT FALSE,
  share_mask      BOOLEAN DEFAULT FALSE,
  severity        VARCHAR(20) DEFAULT 'normal',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS 

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  data        JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ASYNC EVENT LOGS 

CREATE TABLE event_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type  VARCHAR(100) NOT NULL,
  payload     JSONB NOT NULL,
  source      VARCHAR(100),
  status      VARCHAR(20) DEFAULT 'processed',
  error       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  resource    VARCHAR(100),
  resource_id UUID,
  ip_address  VARCHAR(45),
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES 

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_medical_id ON doctors(medical_id);
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_assigned_doctor ON patients(assigned_doctor_id);
CREATE INDEX idx_link_requests_requester ON link_requests(requester_id);
CREATE INDEX idx_link_requests_target ON link_requests(target_id);
CREATE INDEX idx_link_requests_status ON link_requests(status);
CREATE INDEX idx_mri_scans_patient ON mri_scans(patient_id);
CREATE INDEX idx_mri_scans_doctor ON mri_scans(doctor_id);
CREATE INDEX idx_mri_scans_status ON mri_scans(status);
CREATE INDEX idx_ai_analyses_mri ON ai_analyses(mri_scan_id);
CREATE INDEX idx_diagnoses_mri ON diagnoses(mri_scan_id);
CREATE INDEX idx_diagnoses_doctor ON diagnoses(doctor_id);
CREATE INDEX idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_event_logs_type ON event_logs(event_type);

-- TRIGGERS 

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER link_requests_updated_at BEFORE UPDATE ON link_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER mri_scans_updated_at BEFORE UPDATE ON mri_scans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER diagnoses_updated_at BEFORE UPDATE ON diagnoses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
