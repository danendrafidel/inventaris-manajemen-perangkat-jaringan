const db = require('../config/db');

const handleError = (res, error, message = 'Internal Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message });
};

// DIVISION CONTROLLERS (Sebelumnya Witel)
exports.getAllDivisions = async (req, res) => {
  try {
    const query = `
      SELECT d.*, 
             (SELECT COUNT(*) FROM users u WHERE u.division = d.name) as user_count,
             (SELECT COUNT(*) FROM areas a WHERE a.division_id = d.id) as area_count,
             (SELECT COUNT(*) FROM stos s JOIN areas a ON s.area_id = a.id WHERE a.division_id = d.id) as sto_count,
             COALESCE(d.status, 'active') as status,
             d.id as generated_id
      FROM map_divisions d 
      ORDER BY d.name ASC
    `;
    const { rows } = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error, 'Gagal mengambil data Divisi');
  }
};

exports.toggleDivisionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: current } = await db.query('SELECT status FROM map_divisions WHERE id = $1', [id]);
    if (current.length === 0) return res.status(404).json({ success: false, message: 'Divisi tidak ditemukan' });
    
    const newStatus = (current[0].status === 'inactive') ? 'active' : 'inactive';
    await db.query('UPDATE map_divisions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, id]);
    
    res.json({ success: true, message: `Status divisi berhasil diubah ke ${newStatus}` });
  } catch (error) {
    handleError(res, error, 'Gagal mengubah status divisi');
  }
};

exports.createDivision = async (req, res) => {
  try {
    const { name, description, capability } = req.body;
    const { rows } = await db.query(
      'INSERT INTO map_divisions (name, description, capability, status) VALUES ($1, $2, $3, \'active\') RETURNING id, name',
      [name, description, capability]
    );
    res.json({ success: true, data: { ...rows[0], generated_id: rows[0].id.toString() }, message: 'Divisi berhasil ditambahkan' });
  } catch (error) {
    handleError(res, error, 'Gagal menambahkan Divisi');
  }
};

exports.updateDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, capability } = req.body;
    const { rows } = await db.query(
      'UPDATE map_divisions SET name = $1, description = $2, capability = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, description, capability, id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Divisi tidak ditemukan' });
    res.json({ success: true, data: rows[0], message: 'Divisi berhasil diperbarui' });
  } catch (error) {
    handleError(res, error, 'Gagal memperbarui Divisi');
  }
};

exports.deleteDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM map_divisions WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ success: false, message: 'Divisi tidak ditemukan' });
    res.json({ success: true, message: 'Divisi berhasil dihapus' });
  } catch (error) {
    handleError(res, error, 'Gagal menghapus Divisi');
  }
};

// AREA CONTROLLERS (Sebelumnya Kota)
exports.getAllAreas = async (req, res) => {
  try {
    const query = `
      SELECT c.*, d.name as division_name,
             (SELECT COUNT(*) FROM inventory_devices inv WHERE inv.area = c.name) as device_count,
             (SELECT COUNT(*) FROM users u WHERE u.area = c.name AND u.status = 'active') as active_user_count,
             (SELECT COUNT(*) FROM stos s WHERE s.area_id = c.id) as sto_count,
             COALESCE(c.status, 'active') as status, 
             concat(c.division_id, '-', c.id) as generated_id
      FROM areas c 
      JOIN map_divisions d ON c.division_id = d.id 
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
    const { name, division_id, latitude, longitude } = req.body;
    const { rows: div } = await db.query('SELECT id FROM map_divisions WHERE id = $1', [division_id]);
    const { rows } = await db.query(
      'INSERT INTO areas (name, division_id, latitude, longitude, status) VALUES ($1, $2, $3, $4, \'active\') RETURNING id, name',
      [name, division_id, latitude, longitude]
    );
    const areaId = `${div[0].id}-${rows[0].id}`;
    res.json({ success: true, data: { ...rows[0], generated_id: areaId }, message: 'Area berhasil ditambahkan' });
  } catch (error) {
    handleError(res, error, 'Gagal menambahkan Area');
  }
};

exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, division_id, latitude, longitude } = req.body;
    const { rows } = await db.query(
      'UPDATE areas SET name = $1, division_id = $2, latitude = $3, longitude = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, division_id, latitude, longitude, id]
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
      SELECT s.*, c.name as area_name, d.name as division_name,
             (SELECT COUNT(*) FROM inventory_devices inv WHERE inv.sto = s.name) as device_count,
             COALESCE(s.status, 'active') as status, concat(c.division_id, '-', s.area_id, '-', s.id) as generated_id
      FROM stos s 
      JOIN areas c ON s.area_id = c.id 
      JOIN map_divisions d ON c.division_id = d.id 
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
    const { rows: area } = await db.query('SELECT id, division_id FROM areas WHERE id = $1', [area_id]);
    const { rows } = await db.query(
      'INSERT INTO stos (name, area_id, latitude, longitude, status) VALUES ($1, $2, $3, $4, \'active\') RETURNING id, name',
      [name, area_id, latitude, longitude]
    );
    const stoId = `${area[0].division_id}-${area[0].id}-${rows[0].id}`;
    res.json({ success: true, data: { ...rows[0], generated_id: stoId }, message: 'STO berhasil ditambahkan' });
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
