// Business Service - Link Requests Controller (FIXED)
const { getPool } = require('../../config/database');
const { publishEvent, QUEUES } = require('../../config/rabbitmq');

async function sendRequest(req, res) {
  const pool = getPool();
  try {
    const { targetId, message } = req.body;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    if (!targetId) return res.status(400).json({ error: 'targetId is required' });

    // Verify target user exists
    const targetUser = await pool.query('SELECT id, role FROM users WHERE id = $1', [targetId]);
    if (!targetUser.rows.length) return res.status(404).json({ error: 'Target user not found' });

    // Check both directions for existing request
    const existing = await pool.query(
      `SELECT id, status FROM link_requests
       WHERE (requester_id = $1 AND target_id = $2) OR (requester_id = $2 AND target_id = $1)`,
      [requesterId, targetId]
    );
    if (existing.rows.length > 0) {
      const s = existing.rows[0].status;
      if (s === 'pending')  return res.status(409).json({ error: 'Request already pending' });
      if (s === 'accepted') return res.status(409).json({ error: 'Already connected' });
      // If rejected/cancelled: delete old and allow new one
      await pool.query('DELETE FROM link_requests WHERE id = $1', [existing.rows[0].id]);
    }

    const result = await pool.query(
      `INSERT INTO link_requests (requester_id, target_id, requester_role, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [requesterId, targetId, requesterRole, message || null]
    );

    await publishEvent(QUEUES.NOTIFICATION, {
      type: 'connection_request_sent',
      recipientUserId: targetId,
      senderUserId: requesterId,
      requestId: result.rows[0].id
    });

    res.status(201).json({ request: result.rows[0], message: 'Request sent successfully' });
  } catch (err) {
    console.error('[Links] Send request error:', err);
    res.status(500).json({ error: 'Failed to send request', details: err.message });
  }
}

async function acceptRequest(req, res) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const requestResult = await client.query(
      `SELECT * FROM link_requests WHERE id = $1 AND target_id = $2 AND status = 'pending'`,
      [req.params.id, req.user.id]
    );
    if (!requestResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found or already processed' });
    }
    const request = requestResult.rows[0];
    await client.query(`UPDATE link_requests SET status = 'accepted', responded_at = NOW() WHERE id = $1`, [req.params.id]);

    let doctorUserId, patientUserId;
    if (request.requester_role === 'patient') {
      patientUserId = request.requester_id;
      doctorUserId  = request.target_id;
    } else {
      doctorUserId  = request.requester_id;
      patientUserId = request.target_id;
    }

    const docResult = await client.query('SELECT id FROM doctors WHERE user_id = $1', [doctorUserId]);
    if (!docResult.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Doctor not found' }); }
    const doctorId = docResult.rows[0].id;

    await client.query(`UPDATE patients SET assigned_doctor_id = $1 WHERE user_id = $2`, [doctorId, patientUserId]);
    await client.query('COMMIT');

    await publishEvent(QUEUES.NOTIFICATION, {
      type: 'connection_request_accepted',
      recipientUserId: request.requester_id,
      senderUserId: req.user.id,
      requestId: req.params.id
    });

    res.json({ message: 'Request accepted. Doctor-patient link established.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Links] Accept error:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  } finally { client.release(); }
}

async function rejectRequest(req, res) {
  const pool = getPool();
  try {
    const result = await pool.query(
      `UPDATE link_requests SET status = 'rejected', responded_at = NOW()
       WHERE id = $1 AND target_id = $2 AND status = 'pending' RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Request not found' });
    await publishEvent(QUEUES.NOTIFICATION, {
      type: 'connection_request_rejected',
      recipientUserId: result.rows[0].requester_id,
      senderUserId: req.user.id
    });
    res.json({ message: 'Request rejected' });
  } catch (err) { res.status(500).json({ error: 'Failed to reject request' }); }
}

async function getIncomingRequests(req, res) {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT lr.*, u.first_name AS requester_first_name, u.last_name AS requester_last_name,
             u.email AS requester_email, u.role AS requester_role_label,
             d.specialty AS requester_specialty, d.hospital AS requester_hospital
      FROM link_requests lr JOIN users u ON lr.requester_id = u.id
      LEFT JOIN doctors d ON d.user_id = u.id
      WHERE lr.target_id = $1 AND lr.status = 'pending'
      ORDER BY lr.created_at DESC
    `, [req.user.id]);
    res.json({ requests: result.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch requests' }); }
}

async function getOutgoingRequests(req, res) {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT lr.*, u.first_name AS target_first_name, u.last_name AS target_last_name,
             u.email AS target_email, d.specialty AS target_specialty
      FROM link_requests lr JOIN users u ON lr.target_id = u.id
      LEFT JOIN doctors d ON d.user_id = u.id
      WHERE lr.requester_id = $1
      ORDER BY lr.created_at DESC
    `, [req.user.id]);
    res.json({ requests: result.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch requests' }); }
}

module.exports = { sendRequest, acceptRequest, rejectRequest, getIncomingRequests, getOutgoingRequests };
