// MRI Service - Diagnosis Controller
const { getPool } = require('../../config/database');
const { publishEvent, QUEUES } = require('../../config/rabbitmq');

/**
 * POST /api/mri/diagnoses
 * Doctor creates/updates a diagnosis for a scan
 */
async function createDiagnosis(req, res) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { scanId, findings, conclusion, recommendations, followUpDate, severity, isSharedWithPatient, shareMask } = req.body;

    // Verify doctor owns this scan
    const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (docResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Doctor not found' }); }
    const doctorId = docResult.rows[0].id;

    const scanResult = await client.query('SELECT * FROM mri_scans WHERE id = $1 AND doctor_id = $2', [scanId, doctorId]);
    if (scanResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Scan not found or access denied' }); }
    const scan = scanResult.rows[0];

    // Check if diagnosis already exists
    const existingDiag = await client.query('SELECT id FROM diagnoses WHERE mri_scan_id = $1', [scanId]);

    let diagnosisId;
    if (existingDiag.rows.length > 0) {
      // Update existing
      const updated = await client.query(
        `UPDATE diagnoses SET findings=$1, conclusion=$2, recommendations=$3,
          follow_up_date=$4, severity=$5, is_shared_with_patient=$6, share_mask=$7
         WHERE mri_scan_id=$8 RETURNING id`,
        [findings, conclusion, recommendations, followUpDate || null, severity || 'normal',
          isSharedWithPatient || false, shareMask || false, scanId]
      );
      diagnosisId = updated.rows[0].id;
    } else {
      // Get AI analysis ID if exists
      const aiResult = await client.query('SELECT id FROM ai_analyses WHERE mri_scan_id = $1 LIMIT 1', [scanId]);
      const aiId = aiResult.rows.length > 0 ? aiResult.rows[0].id : null;

      const created = await client.query(
        `INSERT INTO diagnoses (mri_scan_id, doctor_id, patient_id, ai_analysis_id,
          findings, conclusion, recommendations, follow_up_date, severity, is_shared_with_patient, share_mask)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [scanId, doctorId, scan.patient_id, aiId, findings, conclusion, recommendations,
          followUpDate || null, severity || 'normal', isSharedWithPatient || false, shareMask || false]
      );
      diagnosisId = created.rows[0].id;
    }

    // Update scan status to completed
    await client.query(`UPDATE mri_scans SET status = 'completed' WHERE id = $1`, [scanId]);

    await client.query('COMMIT');

    // Notify patient if shared
    if (isSharedWithPatient) {
      const patUser = await pool.query(
        'SELECT u.id FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1',
        [scan.patient_id]
      );
      if (patUser.rows.length > 0) {
        await publishEvent(QUEUES.NOTIFICATION, {
          type: 'diagnosis_ready',
          recipientUserId: patUser.rows[0].id,
          scanId,
          diagnosisId
        });
      }
    }

    res.status(201).json({ message: 'Diagnosis saved successfully', diagnosisId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Diagnosis] Create error:', err);
    res.status(500).json({ error: 'Failed to save diagnosis' });
  } finally {
    client.release();
  }
}

/**
 * GET /api/mri/diagnoses/scan/:scanId
 */
async function getDiagnosisByScan(req, res) {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT d.*, ai.predicted_class, ai.confidence, ai.segmentation_mask_path, ai.inference_version
      FROM diagnoses d
      LEFT JOIN ai_analyses ai ON d.ai_analysis_id = ai.id
      WHERE d.mri_scan_id = $1
    `, [req.params.scanId]);

    if (result.rows.length === 0) return res.json({ diagnosis: null });

    const diag = result.rows[0];

    // Patient: only shared diagnoses
    if (req.user.role === 'patient') {
      if (!diag.is_shared_with_patient) return res.json({ diagnosis: null });
      delete diag.predicted_class;
      delete diag.confidence;
      if (!diag.share_mask) delete diag.segmentation_mask_path;
    }

    res.json({ diagnosis: diag });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch diagnosis' });
  }
}

/**
 * GET /api/mri/diagnoses/patient/:patientId
 * Get all diagnoses for a patient
 */
async function getPatientDiagnoses(req, res) {
  const pool = getPool();
  try {
    let whereClause = 'd.patient_id = $1';
    const params = [req.params.patientId];

    if (req.user.role === 'patient') {
      whereClause += ' AND d.is_shared_with_patient = TRUE';
    }

    const result = await pool.query(`
      SELECT d.id, d.findings, d.conclusion, d.recommendations, d.severity,
             d.is_shared_with_patient, d.follow_up_date, d.created_at,
             m.original_filename, m.scan_date, m.id AS scan_id
      FROM diagnoses d
      JOIN mri_scans m ON d.mri_scan_id = m.id
      WHERE ${whereClause}
      ORDER BY d.created_at DESC
    `, params);

    res.json({ diagnoses: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch diagnoses' });
  }
}

module.exports = { createDiagnosis, getDiagnosisByScan, getPatientDiagnoses };
