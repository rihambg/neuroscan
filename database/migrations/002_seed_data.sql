-- NeuroScan Seed Data (FIXED - uses pgcrypto for correct bcrypt hashes)
-- Password for ALL demo accounts: Password123!

INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, gender) VALUES
  ('11111111-1111-1111-1111-111111111101', 'dr.martin@neuroscan.com',
   crypt('Password123!', gen_salt('bf', 10)), 'doctor',  'Jean',   'Martin',  '+33612345678',  'male'),
  ('11111111-1111-1111-1111-111111111102', 'dr.benali@neuroscan.com',
   crypt('Password123!', gen_salt('bf', 10)), 'doctor',  'Amina',  'Benali',  '+213555123456', 'female'),
  ('11111111-1111-1111-1111-111111111103', 'dr.dubois@neuroscan.com',
   crypt('Password123!', gen_salt('bf', 10)), 'doctor',  'Pierre', 'Dubois',  '+33698765432',  'male'),
  ('22222222-2222-2222-2222-222222222201', 'patient.ali@mail.com',
   crypt('Password123!', gen_salt('bf', 10)), 'patient', 'Karim',  'Ali',     '+213770123456', 'male'),
  ('22222222-2222-2222-2222-222222222202', 'patient.sophie@mail.com',
   crypt('Password123!', gen_salt('bf', 10)), 'patient', 'Sophie', 'Bernard', '+33601234567',  'female'),
  ('22222222-2222-2222-2222-222222222203', 'patient.ahmed@mail.com',
   crypt('Password123!', gen_salt('bf', 10)), 'patient', 'Ahmed',  'Meziane', '+213661234567', 'male'),
  ('22222222-2222-2222-2222-222222222204', 'patient.clara@mail.com',
   crypt('Password123!', gen_salt('bf', 10)), 'patient', 'Clara',  'Fontaine','+33645678901',  'female');

INSERT INTO doctors (id, user_id, medical_id, specialty, hospital, department, years_exp, bio, available) VALUES
  ('33333333-3333-3333-3333-333333333301','11111111-1111-1111-1111-111111111101',
   'MD-FR-20142501','Neuroradiology','Hopital Lariboisiere','Radiology',11,
   'Specialist in brain MRI interpretation and tumor diagnosis.',TRUE),
  ('33333333-3333-3333-3333-333333333302','11111111-1111-1111-1111-111111111102',
   'MD-DZ-20181502','Neurology','CHU Mustapha Pacha','Neurology',7,
   'Expert in neurological disorders and brain tumor follow-up.',TRUE),
  ('33333333-3333-3333-3333-333333333303','11111111-1111-1111-1111-111111111103',
   'MD-FR-20091203','Neurosurgery','Hopital Pitie-Salpetriere','Neurosurgery',16,
   'Chief of neurosurgery with extensive tumor resection experience.',TRUE);

INSERT INTO patients (id, user_id, patient_code, blood_type, assigned_doctor_id) VALUES
  ('44444444-4444-4444-4444-444444444401','22222222-2222-2222-2222-222222222201','PAT-2025-001','A+','33333333-3333-3333-3333-333333333301'),
  ('44444444-4444-4444-4444-444444444402','22222222-2222-2222-2222-222222222202','PAT-2025-002','O-','33333333-3333-3333-3333-333333333301'),
  ('44444444-4444-4444-4444-444444444403','22222222-2222-2222-2222-222222222203','PAT-2025-003','B+','33333333-3333-3333-3333-333333333302'),
  ('44444444-4444-4444-4444-444444444404','22222222-2222-2222-2222-222222222204','PAT-2025-004','AB+',NULL);

INSERT INTO mri_scans (id,patient_id,doctor_id,uploaded_by,original_filename,stored_filename,file_path,file_size,file_type,scan_date,status) VALUES
  ('55555555-5555-5555-5555-555555555501','44444444-4444-4444-4444-444444444401','33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222201','brain_mri_jan2025.jpg','uuid-scan-001.jpg','/uploads/uuid-scan-001.jpg',2048000,'jpg','2025-01-15','completed'),
  ('55555555-5555-5555-5555-555555555502','44444444-4444-4444-4444-444444444401','33333333-3333-3333-3333-333333333301','11111111-1111-1111-1111-111111111101','followup_mri_mar2025.jpg','uuid-scan-002.jpg','/uploads/uuid-scan-002.jpg',1890000,'jpg','2025-03-10','reviewed'),
  ('55555555-5555-5555-5555-555555555503','44444444-4444-4444-4444-444444444402','33333333-3333-3333-3333-333333333301','11111111-1111-1111-1111-111111111101','scan_initial.jpg','uuid-scan-003.jpg','/uploads/uuid-scan-003.jpg',3100000,'jpg','2025-02-20','analyzed'),
  ('55555555-5555-5555-5555-555555555504','44444444-4444-4444-4444-444444444403','33333333-3333-3333-3333-333333333302','22222222-2222-2222-2222-222222222203','mri_brain_2025.jpg','uuid-scan-004.jpg','/uploads/uuid-scan-004.jpg',2560000,'jpg','2025-04-01','pending');

INSERT INTO ai_analyses (mri_scan_id,predicted_class,confidence,inference_version,processing_time_ms) VALUES
  ('55555555-5555-5555-5555-555555555501','glioma',87.4,'placeholder-v1.0',1243),
  ('55555555-5555-5555-5555-555555555502','glioma',91.2,'placeholder-v1.0',1089),
  ('55555555-5555-5555-5555-555555555503','meningioma',78.6,'placeholder-v1.0',1371);

INSERT INTO diagnoses (mri_scan_id,doctor_id,patient_id,findings,conclusion,recommendations,is_shared_with_patient,severity) VALUES
  ('55555555-5555-5555-5555-555555555501','33333333-3333-3333-3333-333333333301','44444444-4444-4444-4444-444444444401',
   'T2-weighted MRI reveals a hyperintense lesion in the left frontal lobe, approximately 2.3 cm in diameter. Mild surrounding edema observed.',
   'Findings consistent with low-grade glioma. No midline shift. Recommend neurosurgical consultation.',
   'Neurosurgery referral, repeat MRI in 3 months.',TRUE,'moderate'),
  ('55555555-5555-5555-5555-555555555502','33333333-3333-3333-3333-333333333301','44444444-4444-4444-4444-444444444401',
   'Follow-up MRI shows stable lesion size. No progression noted since January 2025.',
   'Lesion remains stable. Surveillance imaging strategy appropriate.',
   'Continue 3-month surveillance protocol.',TRUE,'moderate');

INSERT INTO notifications (user_id,type,title,message,is_read) VALUES
  ('22222222-2222-2222-2222-222222222201','diagnosis_ready','Diagnosis Available','Dr. Martin has completed your diagnosis for the January scan.',TRUE),
  ('22222222-2222-2222-2222-222222222201','report_available','Report Ready','Your follow-up MRI report is now available.',FALSE),
  ('11111111-1111-1111-1111-111111111101','mri_uploaded','New MRI Uploaded','Patient Karim Ali has uploaded a new MRI scan for review.',TRUE),
  ('11111111-1111-1111-1111-111111111101','connection_request_sent','New Patient Request','Patient Clara Fontaine has sent a connection request.',FALSE);
