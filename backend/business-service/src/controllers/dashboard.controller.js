// Business Service - Dashboard Stats Controller
const { getPool } = require('../../config/database');

/**
 * GET /api/business/dashboard/doctor
 */
async function getDoctorDashboard(req, res) {
  const pool = getPool();
  try {
    const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (docResult.rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });
    const doctorId = docResult.rows[0].id;

    const [patientsRes, scansRes, pendingRequestsRes, recentScansRes, pendingScansRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM patients WHERE assigned_doctor_id = $1', [doctorId]),
      pool.query('SELECT COUNT(*) FROM mri_scans WHERE doctor_id = $1', [doctorId]),
      pool.query(`SELECT COUNT(*) FROM link_requests WHERE target_id = $1 AND status = 'pending'`, [req.user.id]),
      pool.query(`
        SELECT m.id, m.status, m.created_at, m.scan_date, m.original_filename,
               u.first_name, u.last_name, p.patient_code
        FROM mri_scans m
        JOIN patients p ON m.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE m.doctor_id = $1
        ORDER BY m.created_at DESC LIMIT 5
      `, [doctorId]),
      pool.query(`
        SELECT m.id, m.status, m.created_at, m.original_filename,
               u.first_name, u.last_name
        FROM mri_scans m
        JOIN patients p ON m.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE m.doctor_id = $1 AND m.status IN ('pending','processing','analyzed')
        ORDER BY m.created_at ASC
      `, [doctorId]),
    ]);

    res.json({
      stats: {
        totalPatients:   parseInt(patientsRes.rows[0].count),
        totalScans:      parseInt(scansRes.rows[0].count),
        pendingRequests: parseInt(pendingRequestsRes.rows[0].count),
        pendingScans:    pendingScansRes.rows.length,
      },
      recentScans:  recentScansRes.rows,
      pendingScans: pendingScansRes.rows,
    });
  } catch (err) {
    console.error('[Dashboard] Doctor error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

/**
 * GET /api/business/dashboard/patient
 */
async function getPatientDashboard(req, res) {
  const pool = getPool();
  try {
    const patResult = await pool.query(`
      SELECT p.id, p.patient_code, p.assigned_doctor_id,
             d.id AS doc_profile_id, du.first_name AS doctor_first_name, du.last_name AS doctor_last_name,
             d.specialty, d.hospital
      FROM patients p
      LEFT JOIN doctors d ON p.assigned_doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE p.user_id = $1
    `, [req.user.id]);

    if (patResult.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    const patient = patResult.rows[0];

    const [scansRes, diagnosesRes, notifRes] = await Promise.all([
      pool.query(`
        SELECT m.id, m.status, m.created_at, m.scan_date, m.original_filename,
               diag.conclusion, diag.is_shared_with_patient
        FROM mri_scans m
        LEFT JOIN diagnoses diag ON diag.mri_scan_id = m.id
        WHERE m.patient_id = $1
        ORDER BY m.created_at DESC LIMIT 10
      `, [patient.id]),
      pool.query(`
        SELECT COUNT(*) FROM diagnoses WHERE patient_id = $1 AND is_shared_with_patient = TRUE
      `, [patient.id]),
      pool.query(`
        SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE
      `, [req.user.id]),
    ]);

    res.json({
      patient: {
        ...patient,
        totalScans: scansRes.rows.length,
        completedDiagnoses: parseInt(diagnosesRes.rows[0].count),
        unreadNotifications: parseInt(notifRes.rows[0].count),
      },
      recentScans: scansRes.rows,
    });
  } catch (err) {
    console.error('[Dashboard] Patient error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

module.exports = { getDoctorDashboard, getPatientDashboard };
