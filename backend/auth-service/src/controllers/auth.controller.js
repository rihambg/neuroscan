// Auth Service - Authentication Controller (FIXED)
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../config/database');
const { generateToken } = require('../middleware/auth.middleware');

/**
 * POST /api/auth/register
 */
async function register(req, res) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      email, password, role, firstName, lastName, phone, dateOfBirth, gender,
      medicalId, specialty, hospital, department, yearsExp, bio,
      bloodType, allergies, medicalHistory, emergencyContactName, emergencyContactPhone, insuranceNumber
    } = req.body;

    // Check duplicate email
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (role === 'doctor' && medicalId) {
      const existingDoc = await client.query('SELECT id FROM doctors WHERE medical_id = $1', [medicalId]);
      if (existingDoc.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Medical ID already registered' });
      }
    }

    // Hash with bcryptjs (for newly registered users)
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await client.query(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, date_of_birth, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, email.toLowerCase(), passwordHash, role, firstName, lastName,
       phone || null, dateOfBirth || null, gender || null]
    );

    let profileId = uuidv4();
    if (role === 'doctor') {
      await client.query(
        `INSERT INTO doctors (id, user_id, medical_id, specialty, hospital, department, years_exp, bio)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [profileId, userId, medicalId, specialty, hospital || null,
         department || null, parseInt(yearsExp) || 0, bio || null]
      );
    } else {
      const patientCode = 'PAT-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 90000 + 10000);
      await client.query(
        `INSERT INTO patients (id, user_id, patient_code, blood_type, allergies, medical_history,
          emergency_contact_name, emergency_contact_phone, insurance_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [profileId, userId, patientCode, bloodType || null, allergies || null,
         medicalHistory || null, emergencyContactName || null, emergencyContactPhone || null, insuranceNumber || null]
      );
    }

    await client.query('COMMIT');

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name, profileId }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  } finally {
    client.release();
  }
}

/**
 * POST /api/auth/login
 * Supports BOTH bcryptjs hashes (new accounts) AND pgcrypto hashes (seed data)
 */
async function login(req, res) {
  const pool = getPool();
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const hash = user.password_hash;

    // Try bcryptjs verification first (new accounts)
    let validPassword = false;
    if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
      validPassword = await bcrypt.compare(password, hash);
    }

    // If bcryptjs fails, try pgcrypto verification (seed accounts)
    if (!validPassword) {
      const pgResult = await pool.query(
        'SELECT (password_hash = crypt($1, password_hash)) AS valid FROM users WHERE id = $2',
        [password, user.id]
      );
      validPassword = pgResult.rows[0]?.valid === true;
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get profile
    let profileId = null;
    let extraData = {};
    if (user.role === 'doctor') {
      const doc = await pool.query(
        'SELECT id, medical_id, specialty, hospital FROM doctors WHERE user_id = $1', [user.id]
      );
      if (doc.rows.length > 0) {
        profileId = doc.rows[0].id;
        extraData = { medicalId: doc.rows[0].medical_id, specialty: doc.rows[0].specialty, hospital: doc.rows[0].hospital };
      }
    } else {
      const pat = await pool.query(
        'SELECT id, patient_code, assigned_doctor_id FROM patients WHERE user_id = $1', [user.id]
      );
      if (pat.rows.length > 0) {
        profileId = pat.rows[0].id;
        extraData = { patientCode: pat.rows[0].patient_code, assignedDoctorId: pat.rows[0].assigned_doctor_id };
      }
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role,
              firstName: user.first_name, lastName: user.last_name, profileId, ...extraData }
    });

  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * POST /api/auth/validate
 */
async function validateToken(req, res) {
  const { verifyToken } = require('../middleware/auth.middleware');
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ valid: false, error: 'No token' });
  try {
    const decoded = verifyToken(authHeader.split(' ')[1]);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
}

/**
 * POST /api/auth/create-patient
 */
async function createPatientAccount(req, res) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { email, firstName, lastName, phone, dateOfBirth, gender, bloodType, medicalHistory } = req.body;

    const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (docResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Doctor profile not found' });
    }
    const doctorId = docResult.rows[0].id;

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already registered' });
    }

    const tempPassword = 'Temp@' + Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const userId = uuidv4();
    const patientId = uuidv4();
    const patientCode = 'PAT-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 90000 + 10000);

    await client.query(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, date_of_birth, gender)
       VALUES ($1, $2, $3, 'patient', $4, $5, $6, $7, $8)`,
      [userId, email.toLowerCase(), passwordHash, firstName, lastName, phone || null, dateOfBirth || null, gender || null]
    );
    await client.query(
      `INSERT INTO patients (id, user_id, patient_code, blood_type, medical_history, assigned_doctor_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [patientId, userId, patientCode, bloodType || null, medicalHistory || null, doctorId]
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Patient account created',
      patient: { id: patientId, userId, email, firstName, lastName, patientCode, temporaryPassword: tempPassword }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create patient account' });
  } finally {
    client.release();
  }
}

/**
 * GET /api/auth/me
 */
async function me(req, res) {
  const pool = getPool();
  try {
    const r = await pool.query(
      'SELECT id, email, role, first_name, last_name, phone, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed to fetch user' }); }
}

module.exports = { register, login, validateToken, createPatientAccount, me };
