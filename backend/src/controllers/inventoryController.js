const db = require('../config/db');
const cache = require('../config/cache');

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
    cache.invalidate('inventory:');
    cache.invalidate('areas:');
    cache.invalidate('stos:');
    cache.invalidate('offices:');
    cache.invalidate('dashboard:');
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
      return res
        .status(401)
        .json({ success: false, message: "Username/Email atau password salah" });
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
    const cacheKey = `inventory:options:${role || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, source: 'cache' });

    const [areas, stos, statuses, deviceTypes, roles, offices] = await Promise.all([
      db.query("SELECT id, name FROM areas WHERE status = 'active' ORDER BY name ASC"),
      db.query("SELECT id, name, area_id FROM stos WHERE status = 'active' ORDER BY name ASC"),
      db.query("SELECT DISTINCT status FROM inventory_devices"),
      db.query("SELECT DISTINCT device_type FROM inventory_devices"),
      db.query("SELECT DISTINCT role FROM users"),
      db.query("SELECT id, name FROM offices WHERE status = 'active' ORDER BY name ASC"),
    ]);

    const data = {
      areas: areas.rows.map((r) => ({ id: r.id, name: r.name })),
      stos: stos.rows.map((r) => ({ id: r.id, name: r.name, area_id: r.area_id })),
      statuses: statuses.rows.map((r) => r.status),
      deviceTypes: deviceTypes.rows.map((r) => r.device_type),
      roles: roles.rows.map((r) => r.role),
      offices: offices.rows.map((r) => ({
        val: r.id,
        label: r.name
      }))
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
    const cacheKey = `inventory:stats:${area_id || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, source: 'cache' });

    let params = [];
    let whereClause = "";
    if (area_id) {
        params.push(area_id);
        whereClause = "WHERE area_id = $1";
    }

    const [totalDevices, statusBaik, perluPerhatian, areaTercover] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM inventory_devices ${whereClause}`, params),
      db.query(`SELECT COUNT(*) FROM inventory_devices ${whereClause} ${area_id ? 'AND' : 'WHERE'} status = 'OPERATED'`, params),
      db.query(`SELECT COUNT(*) FROM inventory_devices ${whereClause} ${area_id ? 'AND' : 'WHERE'} status IN ('MAINTENANCE', 'PROBLEM')`, params),
      db.query(`SELECT COUNT(DISTINCT area_id) FROM inventory_devices ${whereClause}`, params),
    ]);

    const data = {
        stats: {
            totalDevices: parseInt(totalDevices.rows[0].count),
            statusBaik: parseInt(statusBaik.rows[0].count),
            perluPerhatian: parseInt(perluPerhatian.rows[0].count),
            areaTercoverCount: parseInt(areaTercover.rows[0].count),
        }
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
      where.push(`(i.device_id ILIKE $${params.length} OR i.name ILIKE $${params.length} OR i.serial_number ILIKE $${params.length})`);
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
      db.query(`SELECT COUNT(*) FROM inventory_devices i ${whereClause}`, params),
      db.query(`
        SELECT i.*, a.name as area_name, s.name as sto_name 
        FROM inventory_devices i
        LEFT JOIN areas a ON i.area_id = a.id
        LEFT JOIN stos s ON i.sto_id = s.id
        ${whereClause} 
        ORDER BY i.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, parseInt(limit), offset])
    ]);
    
    res.json({
        success: true,
        data: {
            items: items.rows.map(mapDeviceFromDB),
            total: parseInt(total.rows[0].count)
        }
    });
  } catch (error) {
    handleError(res, error, "Gagal memuat daftar perangkat");
  }
};

exports.createDevice = async (req, res) => {
  try {
    const {
      deviceId, ip, name, deviceType, storageLocation, serialNumber, status, room, area_id, sto_id, totalPort, idlePort
    } = req.body;

    const query = `
      INSERT INTO inventory_devices (
        device_id, ip, name, device_type, storage_location, 
        serial_number, status, room, area_id, sto_id, 
        total_port, idle_port
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      deviceId, ip, name, deviceType, storageLocation, serialNumber, status, room, area_id, sto_id, totalPort || 0, idlePort || 0,
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
      deviceId, ip, name, deviceType, storageLocation, serialNumber, status, room, area_id, sto_id, totalPort, idlePort
    } = req.body;

    const query = `
      UPDATE inventory_devices SET
        device_id = $1, ip = $2, name = $3, device_type = $4, 
        storage_location = $5, serial_number = $6, status = $7, room = $8, 
        area_id = $9, sto_id = $10, 
        total_port = $11, idle_port = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      deviceId, ip, name, deviceType, storageLocation, serialNumber, status, room, area_id, sto_id, totalPort || 0, idlePort || 0, id,
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
      data: mapDeviceFromDB(rows[0])
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
    const query = `
      INSERT INTO users (username, password, name, email, nik, role, area_id, office_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
      RETURNING id
    `;
    await db.query(query, [
      username,
      password,
      name,
      email,
      nik,
      role,
      area_id || null,
      office_id || null,
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
    const query = `
      UPDATE users SET 
        name = $1, email = $2, nik = $3, role = $4, area_id = $5, office_id = $6,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $7
    `;
    const { rowCount } = await db.query(query, [
      name,
      email,
      nik,
      role,
      area_id || null,
      office_id || null,
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
    const { id } = req.body;
    const { rows } = await db.query("SELECT status, username FROM users WHERE id = $1", [
      id,
    ]);

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

    const query = `
      UPDATE users SET 
        name = $1, email = $2, nik = $3, area_id = $4, office_id = $5,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $6
      RETURNING id, username, name, email, nik, role, area_id, office_id, status
    `;
    const { rows } = await db.query(query, [
      name,
      email,
      nik,
      area_id || null,
      office_id || null,
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    // Fetch the full profile after update to include joined data
    const { rows: fullProfile } = await db.query(`
      SELECT u.id, u.username, u.name, u.email, u.nik, u.role, u.area_id, u.status, u.office_id,
             a.name as area,
             o.name as kantor, o.latitude as kantor_latitude, o.longitude as kantor_longitude
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN offices o ON u.office_id = o.id
      WHERE u.id = $1
    `, [id]);

    invalidateAllStats();
    res.json({
      success: true,
      data: fullProfile[0],
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
      distance,
      fuel_cost,
    } = req.body;

    const query = `
      INSERT INTO pmr_reports (
        user_id, device_id, maintenance_date, status, action, notes, distance, fuel_cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      user_id,
      device_id,
      maintenance_date,
      status,
      action,
      notes,
      distance || 0,
      fuel_cost || 0,
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
    const { area_id, role, user_id, search, sto_id, status, start_date, end_date } = req.query;
    let where = [];
    let params = [];

    // Filter by area if provided (for officers)
    if (area_id) {
      params.push(area_id);
      where.push(`u.area_id = $${params.length}`);
    }

    // Filter by user_id if provided (for regular users to see only their logs)
    if (user_id && role !== 'admin' && role !== 'officer') {
      params.push(user_id);
      where.push(`p.user_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      where.push(`(u.name ILIKE $${params.length} OR d.name ILIKE $${params.length} OR d.device_id ILIKE $${params.length})`);
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
      JOIN inventory_devices d ON p.device_id = d.id
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
    const cacheKey = `dashboard:stats:${area_id || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, source: 'cache' });

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
    
    const deviceWhere = whereClause === "WHERE 1=1" ? "" : whereClause.replace("WHERE 1=1 AND ", "WHERE ");
    const deviceCount = await db.query(`SELECT COUNT(*) FROM inventory_devices ${deviceWhere}`, params);
    
    let stoQuery = "SELECT COUNT(*) FROM stos";
    let stoParams = [];
    if (area_id) {
        stoQuery += " WHERE area_id = $1";
        stoParams.push(area_id);
    }
    const stoCount = await db.query(stoQuery, stoParams);

    const data = {
        lastLogin: new Date().toISOString(),
        stats: {
          totalUsers: parseInt(userCount.rows[0].count),
          totalDevices: parseInt(deviceCount.rows[0].count),
          activeLoans: 0,
          units: parseInt(stoCount.rows[0].count),
        },
        meta: {
          usersSuffix: "active",
          devicesSuffix: "online",
          loansSuffix: "loans",
          unitsSuffix: "units",
        },
    };
    
    cache.set(cacheKey, data, 300000); // 5 minutes TTL
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, "Gagal mengambil data dashboard");
  }
};
