const db = require("../config/db");
const { handleError, invalidateAllStats } = require("../utils/helper");

exports.createPmrReport = async (req, res) => {
  try {
    const {
      user_id,
      device_id,
      maintenance_date,
      status,
      action,
      notes,
      device_type,
      serial_number,
      sto,
      room,
      ip,
      port_capacity,
      port_idle,
      port_lan,
      port_sfp,
      port_good,
      port_bad,
      port_notes,
      ping_dns,
      attenuation,
      ping_client,
      speed_test,
      distance,
      fuel_cost,
    } = req.body;

    const maintenance_photos =
      req.files && req.files["maintenance_photo"]
        ? JSON.stringify(
            req.files["maintenance_photo"].map(
              (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
            )
          )
        : null;
    const fuel_receipt =
      req.files && req.files["fuel_receipt"]
        ? `data:${req.files["fuel_receipt"][0].mimetype};base64,${req.files["fuel_receipt"][0].buffer.toString("base64")}`
        : null;

    const query = `
      INSERT INTO pmr_reports (
        user_id, device_id, maintenance_date, status, action, notes,
        device_type, serial_number, sto, room, ip,
        port_capacity, port_idle, port_lan, port_sfp, port_good, port_bad, port_notes,
        ping_dns, attenuation, ping_client, speed_test,
        distance, fuel_cost, maintenance_photo, fuel_receipt
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 
        $7, $8, $9, $10, $11, 
        $12, $13, $14, $15, $16, $17, $18, 
        $19, $20, $21, $22, 
        $23, $24, $25, $26
      )
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      user_id,
      device_id,
      maintenance_date,
      status,
      action,
      notes,
      device_type,
      serial_number,
      sto,
      room,
      ip,
      port_capacity || 0,
      port_idle || 0,
      port_lan || 0,
      port_sfp || 0,
      port_good || 0,
      port_bad || 0,
      port_notes,
      ping_dns,
      attenuation,
      ping_client,
      speed_test,
      distance || 0,
      fuel_cost || 0,
      maintenance_photos,
      fuel_receipt,
    ]);

    invalidateAllStats();
    res.json({
      success: true,
      data: rows[0],
      message: "Laporan PMR berhasil dikirim",
    });
  } catch (error) {
    handleError(res, error, "Gagal mengirim laporan PMR");
  }
};

exports.getAllPmrReports = async (req, res) => {
  try {
    const {
      area_id,
      role,
      user_id,
      search,
      sto_id,
      status,
      start_date,
      end_date,
    } = req.query;
    let where = [];
    let params = [];

    if (area_id) {
      params.push(area_id);
      where.push(`u.area_id = $${params.length}`);
    }

    const userRole = String(role || "").toLowerCase();
    const isAdminEquivalent =
      userRole === "admin" || userRole === "super officer";

    if (user_id && !isAdminEquivalent && userRole !== "officer") {
      params.push(user_id);
      where.push(`p.user_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(u.name ILIKE $${params.length} OR d.name ILIKE $${params.length} OR d.device_id ILIKE $${params.length})`,
      );
    }

    if (sto_id) {
      params.push(sto_id);
      where.push(`d.sto_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      where.push(`p.status = $${params.length}`);
    }

    if (start_date) {
      params.push(start_date);
      where.push(`p.maintenance_date >= $${params.length}`);
    }

    if (end_date) {
      params.push(end_date);
      where.push(`p.maintenance_date <= $${params.length}`);
    }

    const whereClause = where.length > 0 ? "WHERE " + where.join(" AND ") : "";

    const query = `
      SELECT p.*, 
             u.name as technician_name, a.name as technician_area,
             d.name as device_name, d.device_id as device_code, s.name as device_sto
      FROM pmr_reports p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN inventory_devices d ON p.device_id = d.id
      LEFT JOIN stos s ON d.sto_id = s.id
      ${whereClause}
      ORDER BY p.maintenance_date DESC, p.created_at DESC
    `;

    const { rows } = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error, "Gagal mengambil Laporan PMR");
  }
};

exports.updatePmrReport = async (req, res) => {
  try {
    const { id } = req.params;
    let queryParts = [];
    let queryValues = [];
    let counter = 1;

    const { rows: existingRows } = await db.query("SELECT maintenance_photo FROM pmr_reports WHERE id = $1", [id]);
    if (existingRows.length === 0) return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });

    if (req.files && req.files["maintenance_photo"]) {
      let currentPhotos = [];
      try {
        const raw = existingRows[0].maintenance_photo;
        if (raw) currentPhotos = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch(e) {}
      
      const newPhotos = req.files["maintenance_photo"].map(
        (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
      );
      
      queryParts.push(`maintenance_photo = $${counter++}`);
      queryValues.push(JSON.stringify([...currentPhotos, ...newPhotos]));
    }
    
    if (req.files && req.files["fuel_receipt"]) {
      const receipt = `data:${req.files["fuel_receipt"][0].mimetype};base64,${req.files["fuel_receipt"][0].buffer.toString("base64")}`;
      queryParts.push(`fuel_receipt = $${counter++}`);
      queryValues.push(receipt);
    }

    if (queryParts.length === 0) {
      return res.status(400).json({ success: false, message: "Tidak ada data untuk diperbarui" });
    }

    queryValues.push(id);
    const query = `UPDATE pmr_reports SET ${queryParts.join(", ")} WHERE id = $${counter} RETURNING *`;
    
    const { rows } = await db.query(query, queryValues);
    
    invalidateAllStats();
    res.json({ success: true, data: rows[0], message: "Data berhasil diperbarui" });
  } catch (error) {
    handleError(res, error, "Gagal memperbarui laporan PMR");
  }
};

exports.removePmrImage = async (req, res) => {
  try {
    const { id, index } = req.params;
    
    if (index === 'receipt') {
      await db.query("UPDATE pmr_reports SET fuel_receipt = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
      return res.json({ success: true, message: "Nota BBM berhasil dihapus" });
    }

    const { rows } = await db.query("SELECT maintenance_photo FROM pmr_reports WHERE id = $1", [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
    }

    let photos = [];
    try {
      const raw = rows[0].maintenance_photo;
      if (raw) {
        photos = typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
    } catch (e) {
      photos = [];
    }

    const idx = parseInt(index);
    if (idx < 0 || idx >= photos.length) {
      return res.status(400).json({ success: false, message: "Index foto tidak valid" });
    }

    photos.splice(idx, 1);
    
    await db.query("UPDATE pmr_reports SET maintenance_photo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", 
      [JSON.stringify(photos), id]);

    res.json({ success: true, message: "Foto berhasil dihapus" });
  } catch (error) {
    handleError(res, error, "Gagal menghapus foto");
  }
};

exports.updatePmrMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const { fuel_cost, distance } = req.body;

    if (fuel_cost === undefined && distance === undefined) {
      return res.status(400).json({ success: false, message: "Tidak ada data yang diubah" });
    }

    let queryParts = [];
    let queryValues = [];
    let counter = 1;

    if (fuel_cost !== undefined) {
      queryParts.push(`fuel_cost = $${counter++}`);
      queryValues.push(fuel_cost);
    }
    if (distance !== undefined) {
      queryParts.push(`distance = $${counter++}`);
      queryValues.push(distance);
    }

    queryValues.push(id);
    const query = `UPDATE pmr_reports SET ${queryParts.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${counter} RETURNING *`;
    
    const { rows } = await db.query(query, queryValues);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
    }

    res.json({ success: true, data: rows[0], message: "Data PMR berhasil diperbarui" });
  } catch (error) {
    handleError(res, error, "Gagal memperbarui data PMR");
  }
};
