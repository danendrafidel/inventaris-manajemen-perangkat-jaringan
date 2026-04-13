const db = require('../config/db');

const handleError = (res, error, message = 'Internal Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message });
};

// AREA CONTROLLERS (Sebelumnya Kota)
exports.getAllAreas = async (req, res) => {
  try {
    const query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM inventory_devices inv WHERE inv.area = c.name) as device_count,
             (SELECT COUNT(*) FROM users u WHERE u.area = c.name AND u.status = 'active') as active_user_count,
             (SELECT COUNT(*) FROM stos s WHERE s.area_id = c.id) as sto_count,
             COALESCE(c.status, 'active') as status, 
             c.id as generated_id
      FROM areas c 
      ORDER BY c.name ASC
    `;
    const { rows } = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error, 'Gagal mengambil data Area');
  }
};

exports.toggleAreaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: current } = await db.query('SELECT status FROM areas WHERE id = $1', [id]);
    if (current.length === 0) return res.status(404).json({ success: false, message: 'Area tidak ditemukan' });
    
    const newStatus = (current[0].status === 'inactive') ? 'active' : 'inactive';
    await db.query('UPDATE areas SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, id]);
    
    res.json({ success: true, message: `Status area berhasil diubah ke ${newStatus}` });
  } catch (error) {
    handleError(res, error, 'Gagal mengubah status area');
  }
};

exports.createArea = async (req, res) => {
  try {
    const { name, latitude, longitude } = req.body;
    const { rows } = await db.query(
      'INSERT INTO areas (name, latitude, longitude, status) VALUES ($1, $2, $3, \'active\') RETURNING id, name',
      [name, latitude, longitude]
    );
    res.json({ success: true, data: { ...rows[0], generated_id: rows[0].id.toString() }, message: 'Area berhasil ditambahkan' });
  } catch (error) {
    handleError(res, error, 'Gagal menambahkan Area');
  }
};

exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude } = req.body;
    const { rows } = await db.query(
      'UPDATE areas SET name = $1, latitude = $2, longitude = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, latitude, longitude, id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Area tidak ditemukan' });
    res.json({ success: true, data: rows[0], message: 'Area berhasil diperbarui' });
  } catch (error) {
    handleError(res, error, 'Gagal memperbarui Area');
  }
};

exports.deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM areas WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ success: false, message: 'Area tidak ditemukan' });
    res.json({ success: true, message: 'Area berhasil dihapus' });
  } catch (error) {
    handleError(res, error, 'Gagal menghapus Area');
  }
};

// STO CONTROLLERS
exports.getAllStos = async (req, res) => {
  try {
    const query = `
      SELECT s.*, c.name as area_name,
             (SELECT COUNT(*) FROM inventory_devices inv WHERE inv.sto = s.name) as device_count,
             COALESCE(s.status, 'active') as status, s.id as generated_id
      FROM stos s 
      JOIN areas c ON s.area_id = c.id 
      ORDER BY s.name ASC
    `;
    const { rows } = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error, 'Gagal mengambil data STO');
  }
};

exports.toggleStoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: current } = await db.query('SELECT status FROM stos WHERE id = $1', [id]);
    if (current.length === 0) return res.status(404).json({ success: false, message: 'STO tidak ditemukan' });
    
    const newStatus = (current[0].status === 'inactive') ? 'active' : 'inactive';
    await db.query('UPDATE stos SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, id]);
    
    res.json({ success: true, message: `Status STO berhasil diubah ke ${newStatus}` });
  } catch (error) {
    handleError(res, error, 'Gagal mengubah status STO');
  }
};

exports.createSto = async (req, res) => {
  try {
    const { name, area_id, latitude, longitude } = req.body;
    const { rows } = await db.query(
      'INSERT INTO stos (name, area_id, latitude, longitude, status) VALUES ($1, $2, $3, $4, \'active\') RETURNING id, name',
      [name, area_id, latitude, longitude]
    );
    res.json({ success: true, data: { ...rows[0], generated_id: rows[0].id.toString() }, message: 'STO berhasil ditambahkan' });
  } catch (error) {
    handleError(res, error, 'Gagal menambahkan STO');
  }
};

exports.updateSto = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, area_id, latitude, longitude } = req.body;
    const { rows } = await db.query(
      'UPDATE stos SET name = $1, area_id = $2, latitude = $3, longitude = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, area_id, latitude, longitude, id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'STO tidak ditemukan' });
    res.json({ success: true, data: rows[0], message: 'STO berhasil diperbarui' });
  } catch (error) {
    handleError(res, error, 'Gagal memperbarui STO');
  }
};

exports.deleteSto = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM stos WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ success: false, message: 'STO tidak ditemukan' });
    res.json({ success: true, message: 'STO berhasil dihapus' });
  } catch (error) {
    handleError(res, error, 'Gagal menghapus STO');
  }
};
