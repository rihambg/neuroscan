// Business Service - Patient Controller
const { getPool } = require('../../config/database');

/**
 * GET /api/business/patients/me/profile
 */
async function getMyProfile(req, res) {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.gender, u.avatar_url, u.created_at,
             d.id AS doctor_id, du.first_name AS doctor_first_name, du.last_name AS doctor_last_name,
             d.specialty AS doctor_specialty, d.hospital AS doctor_hospital
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN doctors d ON p.assigned_doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE p.user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient profile not found' });
    res.json({ patient: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

/**
 * GET /api/business/patients/:id
 * Get a patient by ID (doctor access)
 */
async function getPatientById(req, res) {
  const pool = getPool();
  try {
    // Verify doctor has access to this patient
    const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (docResult.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
    const doctorId = docResult.rows[0].id;

    const result = await pool.query(`
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.gender,
             (SELECT COUNT(*) FROM mri_scans m WHERE m.patient_id = p.id) AS mri_count
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.assigned_doctor_id = $2
    `, [req.params.id, doctorId]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found or access denied' });
    res.json({ patient: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
}

/**
 * PUT /api/business/patients/me/profile
 */
async function updateMyProfile(req, res) {
  const pool = getPool();
  try {
    const { phone, bloodType, allergies, medicalHistory, emergencyContactName, emergencyContactPhone } = req.body;

    await pool.query(
      `UPDATE patients SET blood_type=$1, allergies=$2, medical_history=$3,
        emergency_contact_name=$4, emergency_contact_phone=$5
       WHERE user_id=$6`,
      [bloodType, allergies, medicalHistory, emergencyContactName, emergencyContactPhone, req.user.id]
    );
    if (phone) await pool.query('UPDATE users SET phone=$1 WHERE id=$2', [phone, req.user.id]);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

/**
 * GET /api/business/patients/me/assigned-doctor
 */
async function getAssignedDoctor(req, res) {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT d.id, d.specialty, d.hospital, d.department, d.years_exp, d.bio, d.available,
             u.first_name, u.last_name, u.email, u.phone, u.avatar_url
      FROM patients p
      JOIN doctors d ON p.assigned_doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE p.user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) return res.json({ doctor: null });
    res.json({ doctor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assigned doctor' });
  }
}

module.exports = { getMyProfile, getPatientById, updateMyProfile, getAssignedDoctor };
