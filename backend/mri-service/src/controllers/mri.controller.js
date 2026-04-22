// MRI Service - MRI Scan Controller
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../config/database');
const { publishEvent, QUEUES } = require('../../config/rabbitmq');
const { UPLOAD_PATH } = require('../middleware/upload.middleware');

// Try to generate thumbnail using sharp if available
async function generateThumbnail(filePath, filename) {
  try {
    const sharp = require('sharp');
    const thumbName = `thumb_${filename}`;
    const thumbPath = path.join(UPLOAD_PATH, 'thumbnails', thumbName);
    await sharp(filePath).resize(200, 200, { fit: 'inside' }).jpeg({ quality: 70 }).toFile(thumbPath);
    return `/uploads/thumbnails/${thumbName}`;
  } catch (e) {
    return null; // thumbnail generation is optional
  }
}

/**
 * POST /api/mri/scans/upload
 */
async function uploadScan(req, res) {
  const pool = getPool();
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const { patientId, notes, scanDate } = req.body;
    const uploaderUserId = req.user.id;

    // Get doctor profile
    const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [uploaderUserId]);
    let doctorId = null;

    if (req.user.role === 'doctor') {
      if (docResult.rows.length === 0) return res.status(403).json({ error: 'Doctor profile not found' });
      doctorId = docResult.rows[0].id;

      // Validate doctor-patient relationship
      const patResult = await pool.query(
        'SELECT id FROM patients WHERE id = $1 AND assigned_doctor_id = $2',
        [patientId, doctorId]
      );
      if (patResult.rows.length === 0) return res.status(403).json({ error: 'Patient not assigned to this doctor' });
    } else if (req.user.role === 'patient') {
      // Patient uploading their own scan
      const patResult = await pool.query('SELECT id, assigned_doctor_id FROM patients WHERE user_id = $1', [uploaderUserId]);
      if (patResult.rows.length === 0) return res.status(403).json({ error: 'Patient profile not found' });
      if (!patResult.rows[0].assigned_doctor_id) return res.status(400).json({ error: 'No doctor assigned yet' });
      doctorId = patResult.rows[0].assigned_doctor_id;

      // patientId must be own id
      if (patResult.rows[0].id !== patientId) return res.status(403).json({ error: 'Cannot upload for another patient' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    const thumbnailPath = await generateThumbnail(req.file.path, req.file.filename);
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    const scanResult = await pool.query(
      `INSERT INTO mri_scans
        (patient_id, doctor_id, uploaded_by, original_filename, stored_filename, file_path,
         file_size, file_type, scan_date, notes, thumbnail_path, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
       RETURNING *`,
      [patientId, doctorId, uploaderUserId, req.file.originalname, req.file.filename,
       filePath, req.file.size, ext, scanDate || new Date().toISOString().split('T')[0],
       notes || null, thumbnailPath]
    );

    const scan = scanResult.rows[0];

    // Publish MRI uploaded event
    await publishEvent(QUEUES.MRI_UPLOAD, {
      scanId: scan.id,
      patientId,
      doctorId,
      uploadedBy: uploaderUserId,
      filePath: scan.file_path
    });

    // Publish notification event
    await publishEvent(QUEUES.NOTIFICATION, {
      type: 'mri_uploaded',
      recipientUserId: req.user.role === 'patient' ? null : uploaderUserId,
      scanId: scan.id,
      patientId
    });

    res.status(201).json({
      message: 'MRI uploaded successfully',
      scan: {
        id: scan.id,
        status: scan.status,
        filePath: scan.file_path,
        thumbnailPath: scan.thumbnail_path,
        originalFilename: scan.original_filename,
        createdAt: scan.created_at
      }
    });
  } catch (err) {
    console.error('[MRI] Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
}

/**
 * GET /api/mri/scans/patient/:patientId
 * Get all scans for a patient
 */
async function getPatientScans(req, res) {
  const pool = getPool();
  try {
    let query, params;

    if (req.user.role === 'doctor') {
      const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      if (docResult.rows.length === 0) return res.status(403).json({ error: 'Doctor not found' });
      query = `
        SELECT m.*, ai.predicted_class, ai.confidence, ai.segmentation_mask_path,
               d.is_shared_with_patient, d.conclusion, d.severity
        FROM mri_scans m
        LEFT JOIN ai_analyses ai ON ai.mri_scan_id = m.id
        LEFT JOIN diagnoses d ON d.mri_scan_id = m.id
        WHERE m.patient_id = $1 AND m.doctor_id = $2
        ORDER BY m.created_at DESC
      `;
      params = [req.params.patientId, docResult.rows[0].id];
    } else {
      // Patient sees own scans
      const patResult = await pool.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
      if (patResult.rows.length === 0) return res.status(403).json({ error: 'Patient not found' });
      if (patResult.rows[0].id !== req.params.patientId) return res.status(403).json({ error: 'Access denied' });

      query = `
        SELECT m.id, m.status, m.created_at, m.scan_date, m.original_filename,
               m.file_path, m.thumbnail_path, m.notes,
               CASE WHEN d.is_shared_with_patient = TRUE THEN d.conclusion ELSE NULL END AS conclusion,
               CASE WHEN d.is_shared_with_patient = TRUE THEN d.findings ELSE NULL END AS findings,
               CASE WHEN d.is_shared_with_patient = TRUE THEN d.recommendations ELSE NULL END AS recommendations,
               CASE WHEN d.is_shared_with_patient = TRUE THEN d.severity ELSE NULL END AS severity,
               CASE WHEN d.is_shared_with_patient = TRUE AND d.share_mask = TRUE THEN ai.segmentation_mask_path ELSE NULL END AS segmentation_mask_path
        FROM mri_scans m
        LEFT JOIN diagnoses d ON d.mri_scan_id = m.id
        LEFT JOIN ai_analyses ai ON ai.mri_scan_id = m.id
        WHERE m.patient_id = $1
        ORDER BY m.created_at DESC
      `;
      params = [req.params.patientId];
    }

    const result = await pool.query(query, params);
    res.json({ scans: result.rows });
  } catch (err) {
    console.error('[MRI] Get scans error:', err);
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
}

/**
 * GET /api/mri/scans/:id
 */
async function getScanById(req, res) {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT m.*, ai.predicted_class, ai.confidence, ai.segmentation_mask_path, ai.inference_version, ai.processed_at,
             d.findings, d.conclusion, d.recommendations, d.severity, d.is_shared_with_patient, d.share_mask, d.follow_up_date,
             u.first_name AS uploader_first_name, u.last_name AS uploader_last_name
      FROM mri_scans m
      LEFT JOIN ai_analyses ai ON ai.mri_scan_id = m.id
      LEFT JOIN diagnoses d ON d.mri_scan_id = m.id
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Scan not found' });
    const scan = result.rows[0];

    // Access control
    if (req.user.role === 'patient') {
      const patResult = await pool.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
      if (!patResult.rows.length || patResult.rows[0].id !== scan.patient_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Hide AI data from patient
      delete scan.predicted_class;
      delete scan.confidence;
      if (!scan.share_mask) delete scan.segmentation_mask_path;
      if (!scan.is_shared_with_patient) {
        delete scan.findings;
        delete scan.conclusion;
        delete scan.recommendations;
      }
    }

    res.json({ scan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
}

/**
 * PUT /api/mri/scans/:id/status
 * Update scan status (doctor only)
 */
async function updateStatus(req, res) {
  const pool = getPool();
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'analyzed', 'reviewed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query(
      `UPDATE mri_scans SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scan not found' });

    await publishEvent(QUEUES.STATUS_UPDATE, {
      scanId: req.params.id,
      newStatus: status,
      updatedBy: req.user.id
    });

    res.json({ message: 'Status updated', scan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
}

module.exports = { uploadScan, getPatientScans, getScanById, updateStatus };
