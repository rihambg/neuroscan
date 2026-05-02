// Business Service - Doctor Controller 
const { getPool } = require('../../config/database');

async function listDoctors(req, res) {
  const pool = getPool();
  try {
    const { search, specialty } = req.query;
    let query = `
      SELECT d.id, d.user_id, d.medical_id, d.specialty, d.hospital, d.department,
             d.years_exp, d.bio, d.available,
             u.first_name, u.last_name, u.email,
             COUNT(p.id) AS patient_count
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN patients p ON p.assigned_doctor_id = d.id
      WHERE u.is_active = TRUE
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR d.specialty ILIKE $${params.length} OR d.hospital ILIKE $${params.length})`;
    }
    if (specialty) {
      params.push(specialty);
      query += ` AND d.specialty = $${params.length}`;
    }
    query += ' GROUP BY d.id, u.id ORDER BY u.last_name ASC';
    const result = await pool.query(query, params);
    res.json({ doctors: result.rows });
  } catch (err) {
    console.error('[Doctor] List error:', err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
}

async function getDoctorById(req, res) {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT d.*, u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.avatar_url,
             COUNT(p.id) AS patient_count
      FROM doctors d JOIN users u ON d.user_id = u.id
      LEFT JOIN patients p ON p.assigned_doctor_id = d.id
      WHERE d.id = $1 GROUP BY d.id, u.id
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ doctor: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch doctor' }); }
}

async function getMyProfile(req, res) {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.created_at
      FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.user_id = $1
    `, [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ doctor: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch profile' }); }
}

async function getMyPatients(req, res) {
  const pool = getPool();
  try {
    const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (!docResult.rows.length) return res.status(404).json({ error: 'Doctor not found' });
    const doctorId = docResult.rows[0].id;
    const result = await pool.query(`
      SELECT p.id, p.patient_code, p.blood_type, p.assigned_doctor_id,
             u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.gender,
             (SELECT COUNT(*) FROM mri_scans m WHERE m.patient_id = p.id) AS mri_count,
             (SELECT m.status FROM mri_scans m WHERE m.patient_id = p.id ORDER BY m.created_at DESC LIMIT 1) AS latest_mri_status,
             (SELECT m.created_at FROM mri_scans m WHERE m.patient_id = p.id ORDER BY m.created_at DESC LIMIT 1) AS latest_mri_date
      FROM patients p JOIN users u ON p.user_id = u.id
      WHERE p.assigned_doctor_id = $1 AND u.is_active = TRUE ORDER BY u.last_name ASC
    `, [doctorId]);
    res.json({ patients: result.rows });
  } catch (err) {
    console.error('[Doctor] Get patients error:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
}

async function updateMyProfile(req, res) {
  const pool = getPool();
  try {
    const { specialty, hospital, department, yearsExp, bio, phone } = req.body;
    await pool.query(
      `UPDATE doctors SET specialty=$1, hospital=$2, department=$3, years_exp=$4, bio=$5 WHERE user_id=$6`,
      [specialty, hospital, department, yearsExp, bio, req.user.id]
    );
    if (phone) await pool.query('UPDATE users SET phone=$1 WHERE id=$2', [phone, req.user.id]);
    res.json({ message: 'Profile updated' });
  } catch (err) { res.status(500).json({ error: 'Failed to update profile' }); }
}

module.exports = { listDoctors, getDoctorById, getMyProfile, getMyPatients, updateMyProfile };
