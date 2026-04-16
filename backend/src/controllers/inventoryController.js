const db = require('../config/db');

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
    area: row.area,
    sto: row.sto,
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

exports.login = async (req, res) => {
  try {
    const { identity, password } = req.body;
    const query =
      "SELECT * FROM users WHERE (username = $1 OR email = $1) AND password = $2 AND status = 'active'";
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
        area: user.area,
        kantor: user.kantor,
        office_id: user.office_id,
      },
    });
  } catch (error) {
    handleError(res, error, "Gagal melakukan login");
  }
};

exports.getInventoryOptions = async (req, res) => {
  try {
    const { role, email } = req.query;
    const [areas, stos, statuses, deviceTypes, roles] = await Promise.all([
      db.query("SELECT DISTINCT name FROM areas"),
      db.query("SELECT DISTINCT name FROM stos"),
      db.query("SELECT DISTINCT status FROM inventory_devices"),
      db.query("SELECT DISTINCT device_type FROM inventory_devices"),
      db.query("SELECT DISTINCT role FROM users"),
    ]);

    res.json({
      success: true,
      data: {
        areas: areas.rows.map((r) => r.name),
        stos: stos.rows.map((r) => r.name),
        statuses: statuses.rows.map((r) => r.status),
        deviceTypes: deviceTypes.rows.map((r) => r.device_type),
        roles: roles.rows.map((r) => r.role),
        offices: [
            { val: 1, label: "Kantor Pusat" },
            { val: 2, label: "Kantor Witel" },
            { val: 3, label: "Kantor Regional" }
        ]
      },
    });
  } catch (error) {
    handleError(res, error, "Gagal memuat opsi filter");
  }
};

exports.getInventoryStats = async (req, res) => {
  try {
    const { area } = req.query;
    let params = [];
    let whereClause = "";
    if (area) {
        params.push(area);
        whereClause = "WHERE area = $1";
    }

    const [totalDevices, statusBaik, perluPerhatian, areaTercover] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM inventory_devices ${whereClause}`, params),
      db.query(`SELECT COUNT(*) FROM inventory_devices ${whereClause} ${area ? 'AND' : 'WHERE'} status = 'OPERATED'`, params),
      db.query(`SELECT COUNT(*) FROM inventory_devices ${whereClause} ${area ? 'AND' : 'WHERE'} status IN ('MAINTENANCE', 'PROBLEM')`, params),
      db.query(`SELECT COUNT(DISTINCT area) FROM inventory_devices ${whereClause}`, params),
    ]);

    res.json({
        success: true,
        data: {
            stats: {
                totalDevices: parseInt(totalDevices.rows[0].count),
                statusBaik: parseInt(statusBaik.rows[0].count),
                perluPerhatian: parseInt(perluPerhatian.rows[0].count),
                areaTercoverCount: parseInt(areaTercover.rows[0].count),
            }
        }
    });
  } catch (error) {
    handleError(res, error, "Gagal memuat statistik inventaris");
  }
};

exports.fetchInventoryDevices = async (req, res) => {
  try {
    const { search, sto, area, status, page, limit } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [];
    let params = [];
    
    if (search) {
      params.push(`%${search}%`);
      where.push(`(device_id ILIKE $${params.length} OR name ILIKE $${params.length} OR serial_number ILIKE $${params.length})`);
    }
    if (sto) {
      params.push(sto);
      where.push(`sto = $${params.length}`);
    }
    if (area) {
      params.push(area);
      where.push(`area = $${params.length}`);
    }
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    
    const whereClause = where.length > 0 ? "WHERE " + where.join(" AND ") : "";
    
    const [total, items] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM inventory_devices ${whereClause}`, params),
      db.query(`SELECT * FROM inventory_devices ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, parseInt(limit), offset])
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
      deviceId, ip, name, deviceType, storageLocation, serialNumber, status, room, area, sto, totalPort, idlePort
    } = req.body;

    const query = `
      INSERT INTO inventory_devices (
        device_id, ip, name, device_type, storage_location, 
        serial_number, status, room, area, sto, 
        total_port, idle_port
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      deviceId, ip, name, deviceType, storageLocation, serialNumber, status, room, area, sto, totalPort || 0, idlePort || 0,
    ]);

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
      deviceId, ip, name, deviceType, storageLocation, serialNumber, status, room, area, sto, totalPort, idlePort
    } = req.body;

    const query = `
      UPDATE inventory_devices SET
        device_id = $1, ip = $2, name = $3, device_type = $4, 
        storage_location = $5, serial_number = $6, status = $7, room = $8, 
        area = $9, sto = $10, 
        total_port = $11, idle_port = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      deviceId, ip, name, deviceType, storageLocation, serialNumber, status, room, area, sto, totalPort, idlePort, id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Perangkat tidak ditemukan" });
    }

    res.json({ success: true, message: "Perangkat berhasil diperbarui" });
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
    
    res.json({ success: true, message: "Perangkat berhasil dihapus" });
  } catch (error) {
    handleError(res, error, "Gagal menghapus perangkat");
  }
};

// USER MANAGEMENT CONTROLLERS
exports.getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.username, u.name, u.email, u.nik, u.role, u.area, u.status, u.office_id,
             o.name as kantor, o.latitude as kantor_latitude, o.longitude as kantor_longitude
      FROM users u
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
    const { username, password, name, email, nik, role, area, office_id } =
      req.body;
    const query = `
      INSERT INTO users (username, password, name, email, nik, role, area, office_id, status)
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
      area,
      office_id || null,
    ]);
    
    res.json({ success: true, message: "User berhasil dibuat" });
  } catch (error) {
    handleError(res, error, "Gagal membuat user");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, nik, role, area, office_id } = req.body;
    const query = `
      UPDATE users SET 
        name = $1, email = $2, nik = $3, role = $4, area = $5, office_id = $6,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $7
    `;
    const { rowCount } = await db.query(query, [
      name,
      email,
      nik,
      role,
      area,
      office_id || null,
      id,
    ]);

    if (rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
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

    res.json({ success: true, message: `User berhasil ${newStatus}` });
  } catch (error) {
    handleError(res, error, "Gagal mengubah status user");
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT u.id, u.username, u.name, u.email, u.nik, u.role, u.area, u.status, u.office_id,
             o.name as kantor, o.latitude as kantor_latitude, o.longitude as kantor_longitude
      FROM users u
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
    const { name, email, nik, area, office_id } = req.body;

    const query = `
      UPDATE users SET 
        name = $1, email = $2, nik = $3, area = $4, office_id = $5,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $6
      RETURNING id, username, name, email, nik, role, area, office_id, status
    `;
    const { rows } = await db.query(query, [
      name,
      email,
      nik,
      area,
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
      SELECT u.id, u.username, u.name, u.email, u.nik, u.role, u.area, u.status, u.office_id,
             o.name as kantor, o.latitude as kantor_latitude, o.longitude as kantor_longitude
      FROM users u
      LEFT JOIN offices o ON u.office_id = o.id
      WHERE u.id = $1
    `, [id]);

    res.json({
      success: true,
      data: fullProfile[0],
      message: "Profil berhasil diperbarui",
    });
  } catch (error) {
    handleError(res, error, "Gagal memperbarui profil");
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const { area } = req.query;
    let whereClause = "WHERE 1=1";
    const params = [];

    if (area) {
      params.push(area);
      whereClause += ` AND area = $${params.length}`;
    }

    let userQuery = "SELECT COUNT(*) FROM users";
    let userParams = [];
    if (area) {
      userQuery += " WHERE area = $1";
      userParams.push(area);
    }
    const userCount = await db.query(userQuery, userParams);
    
    const deviceWhere = whereClause === "WHERE 1=1" ? "" : whereClause.replace("WHERE 1=1 AND ", "WHERE ");
    const deviceCount = await db.query(`SELECT COUNT(*) FROM inventory_devices ${deviceWhere}`, params);
    
    let stoQuery = "SELECT COUNT(*) FROM stos";
    let stoParams = [];
    if (area) {
        stoQuery += " s JOIN areas a ON s.area_id = a.id WHERE a.name = $1";
        stoParams.push(area);
    }
    const stoCount = await db.query(stoQuery, stoParams);

    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    handleError(res, error, "Gagal mengambil data dashboard");
  }
};
