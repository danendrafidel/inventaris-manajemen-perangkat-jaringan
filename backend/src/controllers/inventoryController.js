const db = require("../config/db");
const cache = require("../config/cache");
const mailer = require("../config/mailer");
const crypto = require("crypto");

function mapDeviceFromDB(row) {
  return {
    id: row.id,
    deviceId: row.device_id,
    ip: row.ip,
    name: row.name,
    deviceType: row.device_type,
    storageLocation: row.storage_location,
    serialNumber: row.serial_number,
    status: row.status,
    room: row.room,
    area: row.area_name || row.area,
    area_id: row.area_id,
    sto: row.sto_name || row.sto,
    sto_id: row.sto_id,
    totalPort: row.total_port,
    idlePort: row.idle_port,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function handleError(res, error, defaultMessage) {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage });
}

function invalidateAllStats() {
  cache.invalidate("inventory:");
  cache.invalidate("areas:");
  cache.invalidate("stos:");
  cache.invalidate("offices:");
  cache.invalidate("dashboard:");
}

exports.login = async (req, res) => {
  try {
    const { identity, password } = req.body;
    const query = `
      SELECT u.id, u.username, u.name, u.email, u.nik, u.role, u.area_id, u.status, u.office_id,
             a.name as area_name,
             o.name as kantor, o.latitude as kantor_latitude, o.longitude as kantor_longitude
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN offices o ON u.office_id = o.id
      WHERE (u.username = $1 OR u.email = $1) AND u.password = $2 AND u.status = 'active'
    `;
    const { rows } = await db.query(query, [identity, password]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username/Email atau password salah",
      });
    }

    const user = rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        area: user.area_name,
        area_id: user.area_id,
        kantor: user.kantor,
        office_id: user.office_id,
        kantor_latitude: user.kantor_latitude,
        kantor_longitude: user.kantor_longitude,
      },
    });
  } catch (error) {
    handleError(res, error, "Gagal melakukan login");
  }
};

exports.getInventoryOptions = async (req, res) => {
  try {
    const { role, email } = req.query;
    const cacheKey = `inventory:options:${role || "all"}`;
    const cached = cache.get(cacheKey);
    if (cached)
      return res.json({ success: true, data: cached, source: "cache" });

    const [areas, stos, statuses, deviceTypes, roles, offices] =
      await Promise.all([
        db.query(
          "SELECT id, name FROM areas WHERE status = 'active' ORDER BY name ASC",
        ),
        db.query(
          "SELECT id, name, area_id FROM stos WHERE status = 'active' ORDER BY name ASC",
        ),
        db.query("SELECT DISTINCT status FROM inventory_devices"),
        db.query("SELECT DISTINCT device_type FROM inventory_devices"),
        db.query("SELECT DISTINCT role FROM users"),
        db.query(
          "SELECT id, name, area_id FROM offices WHERE status = 'active' ORDER BY name ASC",
        ),
      ]);

    const data = {
      areas: areas.rows.map((r) => ({ id: r.id, name: r.name })),
      stos: stos.rows.map((r) => ({
        id: r.id,
        name: r.name,
        area_id: r.area_id,
      })),
      statuses: statuses.rows.map((r) => r.status),
      deviceTypes: deviceTypes.rows.map((r) => r.device_type),
      roles: roles.rows.map((r) => r.role),
      offices: offices.rows.map((r) => ({
        val: r.id,
        label: r.name,
        area_id: r.area_id,
      })),
    };

    cache.set(cacheKey, data);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, "Gagal memuat opsi filter");
  }
};

exports.getInventoryStats = async (req, res) => {
  try {
    const { area_id } = req.query;
    const cacheKey = `inventory:stats:${area_id || "all"}`;
    const cached = cache.get(cacheKey);
    if (cached)
      return res.json({ success: true, data: cached, source: "cache" });

    let params = [];
    let whereClause = "";
    if (area_id) {
      params.push(area_id);
      whereClause = "WHERE area_id = $1";
    }

    const [totalDevices, statusBaik, perluPerhatian, areaTercover] =
      await Promise.all([
        db.query(
          `SELECT COUNT(*) FROM inventory_devices ${whereClause}`,
          params,
        ),
        db.query(
          `SELECT COUNT(*) FROM inventory_devices ${whereClause} ${area_id ? "AND" : "WHERE"} status = 'OPERATED'`,
          params,
        ),
        db.query(
          `SELECT COUNT(*) FROM inventory_devices ${whereClause} ${area_id ? "AND" : "WHERE"} status IN ('MAINTENANCE', 'PROBLEM')`,
          params,
        ),
        db.query(
          `SELECT COUNT(DISTINCT area_id) FROM inventory_devices ${whereClause}`,
          params,
        ),
      ]);

    const data = {
      stats: {
        totalDevices: parseInt(totalDevices.rows[0].count),
        statusBaik: parseInt(statusBaik.rows[0].count),
        perluPerhatian: parseInt(perluPerhatian.rows[0].count),
        areaTercoverCount: parseInt(areaTercover.rows[0].count),
      },
    };

    cache.set(cacheKey, data, 60000); // 1 minute TTL for stats
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, "Gagal memuat statistik inventaris");
  }
};

exports.fetchInventoryDevices = async (req, res) => {
  try {
    const { search, sto_id, area_id, status, page, limit } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [];
    let params = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(i.device_id ILIKE $${params.length} OR i.name ILIKE $${params.length} OR i.serial_number ILIKE $${params.length})`,
      );
    }
    if (sto_id) {
      params.push(sto_id);
      where.push(`i.sto_id = $${params.length}`);
    }
    if (area_id) {
      params.push(area_id);
      where.push(`i.area_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      where.push(`i.status = $${params.length}`);
    }

    const whereClause = where.length > 0 ? "WHERE " + where.join(" AND ") : "";

    const [total, items] = await Promise.all([
      db.query(
        `SELECT COUNT(*) FROM inventory_devices i ${whereClause}`,
        params,
      ),
      db.query(
        `
        SELECT i.*, a.name as area_name, s.name as sto_name 
        FROM inventory_devices i
        LEFT JOIN areas a ON i.area_id = a.id
        LEFT JOIN stos s ON i.sto_id = s.id
        ${whereClause} 
        ORDER BY i.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `,
        [...params, parseInt(limit), offset],
      ),
    ]);

    res.json({
      success: true,
      data: {
        items: items.rows.map(mapDeviceFromDB),
        total: parseInt(total.rows[0].count),
      },
    });
  } catch (error) {
    handleError(res, error, "Gagal memuat daftar perangkat");
  }
};

exports.createDevice = async (req, res) => {
  try {
    const {
      deviceId,
      ip,
      name,
      deviceType,
      storageLocation,
      serialNumber,
      status,
      room,
      area_id,
      sto_id,
      totalPort,
      idlePort,
    } = req.body;

    const final_area_id = area_id && area_id !== "" ? parseInt(area_id) : null;
    const final_sto_id = sto_id && sto_id !== "" ? parseInt(sto_id) : null;

    // Ambil nama Area & STO secara eksplisit
    let area_name = null;
    let sto_name = null;

    if (final_area_id) {
      const areaRes = await db.query("SELECT name FROM areas WHERE id = $1", [
        final_area_id,
      ]);
      if (areaRes.rows.length > 0) area_name = areaRes.rows[0].name;
    }
    if (final_sto_id) {
      const stoRes = await db.query("SELECT name FROM stos WHERE id = $1", [
        final_sto_id,
      ]);
      if (stoRes.rows.length > 0) sto_name = stoRes.rows[0].name;
    }

    const query = `
      INSERT INTO inventory_devices (
        device_id, ip, name, device_type, storage_location, 
        serial_number, status, room, area_id, sto_id, 
        area, sto, total_port, idle_port
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      deviceId,
      ip,
      name,
      deviceType,
      storageLocation,
      serialNumber,
      status,
      room,
      final_area_id,
      final_sto_id,
      area_name,
      sto_name,
      totalPort || 0,
      idlePort || 0,
    ]);

    invalidateAllStats();
    res.json({
      success: true,
      data: mapDeviceFromDB(rows[0]),
      message: "Perangkat berhasil ditambahkan",
    });
  } catch (error) {
    handleError(res, error, "Gagal menambahkan perangkat");
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      deviceId,
      ip,
      name,
      deviceType,
      storageLocation,
      serialNumber,
      status,
      room,
      area_id,
      sto_id,
      totalPort,
      idlePort,
    } = req.body;

    const final_area_id = area_id && area_id !== "" ? parseInt(area_id) : null;
    const final_sto_id = sto_id && sto_id !== "" ? parseInt(sto_id) : null;

    // Ambil nama Area & STO secara eksplisit
    let area_name = null;
    let sto_name = null;

    if (final_area_id) {
      const areaRes = await db.query("SELECT name FROM areas WHERE id = $1", [
        final_area_id,
      ]);
      if (areaRes.rows.length > 0) area_name = areaRes.rows[0].name;
    }
    if (final_sto_id) {
      const stoRes = await db.query("SELECT name FROM stos WHERE id = $1", [
        final_sto_id,
      ]);
      if (stoRes.rows.length > 0) sto_name = stoRes.rows[0].name;
    }

    const query = `
      UPDATE inventory_devices SET
        device_id = $1, ip = $2, name = $3, device_type = $4, 
        storage_location = $5, serial_number = $6, status = $7, room = $8, 
        area_id = $9, sto_id = $10, area = $11, sto = $12,
        total_port = $13, idle_port = $14, updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      deviceId,
      ip,
      name,
      deviceType,
      storageLocation,
      serialNumber,
      status,
      room,
      final_area_id,
      final_sto_id,
      area_name,
      sto_name,
      totalPort || 0,
      idlePort || 0,
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Perangkat tidak ditemukan" });
    }

    invalidateAllStats();
    res.json({
      success: true,
      message: "Perangkat berhasil diperbarui",
      data: mapDeviceFromDB(rows[0]),
    });
  } catch (error) {
    handleError(res, error, "Gagal memperbarui perangkat");
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query(
      "DELETE FROM inventory_devices WHERE id = $1",
      [id],
    );

    if (rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Perangkat tidak ditemukan" });
    }

    invalidateAllStats();
    res.json({ success: true, message: "Perangkat berhasil dihapus" });
  } catch (error) {
    handleError(res, error, "Gagal menghapus perangkat");
  }
};

// USER MANAGEMENT CONTROLLERS
exports.getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.username, u.name, u.email, u.nik, u.role, u.area_id, u.status, u.office_id,
             a.name as area,
             o.name as kantor, o.latitude as kantor_latitude, o.longitude as kantor_longitude
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN offices o ON u.office_id = o.id
      ORDER BY u.created_at DESC
    `;
    const { rows } = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error, "Gagal mengambil data user");
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, name, email, nik, role, area_id, office_id } =
      req.body;

    const final_area_id = area_id && area_id !== "" ? parseInt(area_id) : null;
    const final_office_id =
      office_id && office_id !== "" ? parseInt(office_id) : null;

    // Ambil nama Area & Kantor secara eksplisit
    let area_name = null;
    let office_name = null;

    if (final_area_id) {
      const areaRes = await db.query("SELECT name FROM areas WHERE id = $1", [
        final_area_id,
      ]);
      if (areaRes.rows.length > 0) area_name = areaRes.rows[0].name;
    }
    if (final_office_id) {
      const officeRes = await db.query(
        "SELECT name FROM offices WHERE id = $1",
        [final_office_id],
      );
      if (officeRes.rows.length > 0) office_name = officeRes.rows[0].name;
    }

    const query = `
      INSERT INTO users (username, password, name, email, nik, role, area_id, office_id, area, kantor, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
      RETURNING id
    `;
    await db.query(query, [
      username,
      password,
      name,
      email,
      nik,
      role,
      final_area_id,
      final_office_id,
      area_name,
      office_name,
    ]);

    invalidateAllStats();
    res.json({ success: true, message: "User berhasil dibuat" });
  } catch (error) {
    handleError(res, error, "Gagal membuat user");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, nik, role, area_id, office_id } = req.body;

    const final_area_id = area_id && area_id !== "" ? parseInt(area_id) : null;
    const final_office_id =
      office_id && office_id !== "" ? parseInt(office_id) : null;

    // Ambil nama Area & Kantor secara eksplisit
    let area_name = null;
    let office_name = null;

    if (final_area_id) {
      const areaRes = await db.query("SELECT name FROM areas WHERE id = $1", [
        final_area_id,
      ]);
      if (areaRes.rows.length > 0) area_name = areaRes.rows[0].name;
    }
    if (final_office_id) {
      const officeRes = await db.query(
        "SELECT name FROM offices WHERE id = $1",
        [final_office_id],
      );
      if (officeRes.rows.length > 0) office_name = officeRes.rows[0].name;
    }

    const query = `
      UPDATE users SET 
        name = $1, email = $2, nik = $3, role = $4, area_id = $5, office_id = $6,
        area = $7, kantor = $8,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $9
    `;
    const { rowCount } = await db.query(query, [
      name,
      email,
      nik,
      role,
      final_area_id,
      final_office_id,
      area_name,
      office_name,
      id,
    ]);

    if (rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    invalidateAllStats();
    res.json({ success: true, message: "User berhasil diperbarui" });
  } catch (error) {
    handleError(res, error, "Gagal memperbarui user");
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const { rowCount } = await db.query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [password, id],
    );

    if (rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    res.json({ success: true, message: "Password berhasil diganti" });
  } catch (error) {
    handleError(res, error, "Gagal mengganti password");
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "SELECT status, username FROM users WHERE id = $1",
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    const newStatus = rows[0].status === "active" ? "inactive" : "active";
    await db.query(
      "UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newStatus, id],
    );

    invalidateAllStats();
    res.json({ success: true, message: `User berhasil ${newStatus}` });
  } catch (error) {
    handleError(res, error, "Gagal mengubah status user");
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT u.id, u.username, u.name, u.email, u.nik, u.role, u.area_id, u.status, u.office_id,
             a.name as area,
             o.name as kantor, o.latitude as kantor_latitude, o.longitude as kantor_longitude
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN offices o ON u.office_id = o.id
      WHERE u.id = $1
    `;
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    handleError(res, error, "Gagal mengambil profil");
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, nik, area_id, office_id } = req.body;

    const final_area_id = area_id && area_id !== "" ? parseInt(area_id) : null;
    const final_office_id =
      office_id && office_id !== "" ? parseInt(office_id) : null;

    // Ambil nama Area & Kantor secara eksplisit
    let area_name = null;
    let office_name = null;

    if (final_area_id) {
      const areaRes = await db.query("SELECT name FROM areas WHERE id = $1", [
        final_area_id,
      ]);
      if (areaRes.rows.length > 0) area_name = areaRes.rows[0].name;
    }
    if (final_office_id) {
      const officeRes = await db.query(
        "SELECT name FROM offices WHERE id = $1",
        [final_office_id],
      );
      if (officeRes.rows.length > 0) office_name = officeRes.rows[0].name;
    }

    const query = `
      UPDATE users SET 
        name = $1, email = $2, nik = $3, area_id = $4, office_id = $5,
        area = $6, kantor = $7,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $8
      RETURNING id, username, name, email, nik, role, area_id, office_id, area, kantor, status
    `;
    const { rows } = await db.query(query, [
      name,
      email,
      nik,
      final_area_id,
      final_office_id,
      area_name,
      office_name,
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    invalidateAllStats();
    res.json({
      success: true,
      data: rows[0],
      message: "Profil berhasil diperbarui",
    });
  } catch (error) {
    handleError(res, error, "Gagal memperbarui profil");
  }
};

// PMR REPORTS
exports.createPmrReport = async (req, res) => {
  try {
    const {
      user_id,
      device_id,
      maintenance_date,
      status,
      action,
      notes,
      // Data Perangkat
      device_type,
      serial_number,
      sto,
      room,
      ip,
      // Detail Port
      port_capacity,
      port_idle,
      port_lan,
      port_sfp,
      port_good,
      port_bad,
      port_notes,
      // Tes Koneksi
      ping_dns,
      attenuation,
      ping_client,
      speed_test,
      // Logistik
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

    // Filter by area if provided (for officers)
    if (area_id) {
      params.push(area_id);
      where.push(`u.area_id = $${params.length}`);
    }

    const userRole = String(role || "").toLowerCase();
    const isAdminEquivalent =
      userRole === "admin" || userRole === "super officer";

    // Filter by user_id if provided.
    // Admins, Super Officers, and Officers can see all reports (or reports in their area if area_id is set).
    // Regular users (role 'user') only see their own logs.
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

exports.getDashboard = async (req, res) => {
  try {
    const { area_id } = req.query;
    const cacheKey = `dashboard:stats:${area_id || "all"}`;
    const cached = cache.get(cacheKey);
    if (cached)
      return res.json({ success: true, data: cached, source: "cache" });

    let whereClause = "WHERE 1=1";
    const params = [];

    if (area_id) {
      params.push(area_id);
      whereClause += ` AND area_id = $${params.length}`;
    }

    let userQuery = "SELECT COUNT(*) FROM users";
    let userParams = [];
    if (area_id) {
      userQuery += " WHERE area_id = $1";
      userParams.push(area_id);
    }
    const userCount = await db.query(userQuery, userParams);

    const deviceWhere =
      whereClause === "WHERE 1=1"
        ? ""
        : whereClause.replace("WHERE 1=1 AND ", "WHERE ");
    const deviceCount = await db.query(
      `SELECT COUNT(*) FROM inventory_devices ${deviceWhere}`,
      params,
    );

    let stoQuery = "SELECT COUNT(*) FROM stos";
    let stoParams = [];
    if (area_id) {
      stoQuery += " WHERE area_id = $1";
      stoParams.push(area_id);
    }
    const stoCount = await db.query(stoQuery, stoParams);

    let areaQuery = "SELECT COUNT(*) FROM areas";
    let areaParams = [];
    if (area_id) {
      areaQuery += " WHERE id = $1";
      areaParams.push(area_id);
    }
    const areaCount = await db.query(areaQuery, areaParams);

    const data = {
      lastLogin: new Date().toISOString(),
      stats: {
        totalUsers: parseInt(userCount.rows[0].count),
        totalDevices: parseInt(deviceCount.rows[0].count),
        totalAreas: parseInt(areaCount.rows[0].count),
        units: parseInt(stoCount.rows[0].count),
      },
      meta: {
        usersSuffix: "active",
        devicesSuffix: "online",
        areasSuffix: "areas",
        unitsSuffix: "units",
      },
    };

    cache.set(cacheKey, data, 300000); // 5 minutes TTL
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, "Gagal mengambil data dashboard");
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[ForgotPassword] Request for: ${email}`);

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email harus diisi" });
    }

    const { rows } = await db.query(
      "SELECT id, email, name FROM users WHERE email = $1",
      [email],
    );

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email tidak terdaftar" });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 jam dari sekarang

    // Simpan token ke database
    await db.query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3",
      [token, expires, email],
    );

    // Deteksi URL dasar secara dinamis
    const protocol =
      req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
    const host = req.headers["host"];
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;

    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Inventaris Manajemen" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Permintaan Reset Password",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Halo, ${user.name}</h2>
          <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
          <p>Silakan klik tombol di bawah ini untuk mereset password Anda:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Reset Password Saya</a>
          </div>
          <p style="font-size: 13px; color: #666;">Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
          <p style="font-size: 12px; color: #2563eb; word-break: break-all;">${resetLink}</p>
          <p style="font-size: 13px; color: #666; margin-top: 20px;">Link ini akan kadaluarsa dalam 1 jam.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999; text-align: center;">Sistem Manajemen Inventaris Perangkat Jaringan</p>
        </div>
      `,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("[MAILER ERROR] Konfigurasi SMTP belum lengkap");
      return res.status(500).json({
        success: false,
        message: "Konfigurasi server email belum lengkap. Hubungi Admin.",
      });
    }

    await mailer.sendMail(mailOptions);
    res.json({
      success: true,
      message: "Link reset password telah dikirim ke email Anda",
    });
  } catch (error) {
    handleError(res, error, "Gagal mengirim email reset password");
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Cari user berdasarkan token dan pastikan belum expired
    const { rows } = await db.query(
      "SELECT id, email FROM users WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP",
      [token],
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Link reset tidak valid atau sudah kadaluarsa",
      });
    }

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 6 karakter",
      });
    }

    await db.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [newPassword, rows[0].id],
    );

    res.json({
      success: true,
      message: "Password berhasil direset. Silakan login dengan password baru.",
    });
  } catch (error) {
    handleError(res, error, "Gagal mereset password");
  }
};

exports.updatePmrReport = async (req, res) => {
  console.log("Files:", req.files);
  console.log("Body:", req.body);
  try {
    const { id } = req.params;
    let queryParts = [];
    let queryValues = [];
    let counter = 1;

    if (req.files && req.files["maintenance_photo"]) {
      const photo = `data:${req.files["maintenance_photo"][0].mimetype};base64,${req.files["maintenance_photo"][0].buffer.toString("base64")}`;
      queryParts.push(`maintenance_photo = $${counter++}`);
      queryValues.push(photo);
    }
    if (req.files && req.files["fuel_receipt"]) {
      const receipt = `data:${req.files["fuel_receipt"][0].mimetype};base64,${req.files["fuel_receipt"][0].buffer.toString("base64")}`;
      queryParts.push(`fuel_receipt = $${counter++}`);
      queryValues.push(receipt);
    }

    if (queryParts.length === 0) {
      return res.status(400).json({ success: false, message: "Tidak ada gambar untuk diperbarui" });
    }

    queryValues.push(id);
    const query = `UPDATE pmr_reports SET ${queryParts.join(", ")} WHERE id = $${counter} RETURNING *`;
    
    const { rows } = await db.query(query, queryValues);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
    }

    invalidateAllStats();
    res.json({ success: true, data: rows[0], message: "Gambar berhasil diperbarui" });
  } catch (error) {
    handleError(res, error, "Gagal memperbarui laporan PMR");
  }
};