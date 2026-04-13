const db = require("../config/db");

// Helper to handle errors
const handleError = (res, error, message = "Internal Server Error") => {
  console.error(error);
  res.status(500).json({ success: false, message });
};

// Helper to map DB row to Frontend object
const mapDeviceFromDB = (row) => ({
  id: row.id,
  deviceId: row.device_id,
  ip: row.ip,
  name: row.name,
  deviceType: row.device_type,
  storage_location: row.storage_location,
  serialNumber: row.serial_number,
  status: row.status,
  room: row.room,
  kind: row.kind,
  division: row.division,
  area: row.area,
  sto: row.sto,
  totalPort: row.total_port,
  idlePort: row.idle_port,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const hasColumn = async (tableName, columnName) => {
  const { rows } = await db.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [tableName, columnName],
  );
  return rows.length > 0;
};

// Auth & Session
exports.login = async (req, res) => {
  try {
    const { identity, password } = req.body || {};
    const query = `
      SELECT * FROM users 
      WHERE (LOWER(email) = LOWER($1) OR username = $1) 
      AND password = $2
    `;
    const { rows } = await db.query(query, [identity, password]);

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Kredensial salah" });
    }

    const user = rows[0];
    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ success: false, message: "Akun Anda dinonaktifkan" });
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    handleError(res, error, "Gagal melakukan login");
  }
};

// Inventory Device Logic
exports.getStats = async (req, res) => {
  try {
    const { division, area } = req.query;
    let whereClause = "WHERE 1=1";
    const params = [];

    if (division) {
      params.push(division);
      whereClause += ` AND division = $${params.length}`;
    }
    if (area) {
      params.push(area);
      whereClause += ` AND area = $${params.length}`;
    }

    const totalQuery = `SELECT COUNT(*) FROM inventory_devices ${whereClause}`;
    const baikQuery = `SELECT COUNT(*) FROM inventory_devices ${whereClause} AND status = 'OPERATED'`;
    const areaQuery = `SELECT COUNT(DISTINCT area) FROM inventory_devices ${whereClause}`;
    const portQuery = `SELECT SUM(total_port) as total, SUM(idle_port) as idle FROM inventory_devices ${whereClause}`;

    const [total, baik, areas, ports] = await Promise.all([
      db.query(totalQuery, params),
      db.query(baikQuery, params),
      db.query(areaQuery, params),
      db.query(portQuery, params),
    ]);

    const totalCount = parseInt(total.rows[0].count) || 0;
    const baikCount = parseInt(baik.rows[0].count) || 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalDevices: totalCount,
          statusBaik: baikCount,
          perluPerhatian: totalCount - baikCount,
          areaTercoverCount: parseInt(areas.rows[0].count) || 0,
          totalPorts: parseInt(ports.rows[0].total) || 0,
          idlePorts: parseInt(ports.rows[0].idle) || 0,
        },
      },
    });
  } catch (error) {
    handleError(res, error, "Gagal mengambil statistik");
  }
};

exports.getOptions = async (req, res) => {
  try {
    // Queries to aggregate master data + existing usage data
    const queries = {
      divisions: `
        SELECT name as val FROM map_divisions 
        UNION 
        SELECT DISTINCT division FROM inventory_devices WHERE division IS NOT NULL AND division != '' 
        UNION 
        SELECT DISTINCT division FROM users WHERE division IS NOT NULL AND division != ''
      `,
      areas: `
        SELECT name as val FROM areas 
        UNION 
        SELECT DISTINCT area FROM inventory_devices WHERE area IS NOT NULL AND area != '' 
        UNION 
        SELECT DISTINCT area FROM users WHERE area IS NOT NULL AND area != ''
      `,
      stos: `
        SELECT name as val FROM stos 
        UNION 
        SELECT DISTINCT sto FROM inventory_devices WHERE sto IS NOT NULL AND sto != ''
      `,
      statuses:
        "SELECT DISTINCT status FROM inventory_devices WHERE status IS NOT NULL AND status != ''",
      kinds:
        "SELECT DISTINCT kind FROM inventory_devices WHERE kind IS NOT NULL AND kind != ''",
      deviceTypes:
        "SELECT DISTINCT device_type FROM inventory_devices WHERE device_type IS NOT NULL AND device_type != ''",
      roles:
        "SELECT DISTINCT role FROM users WHERE role IS NOT NULL AND role != ''",
    };

    const results = await Promise.all(
      Object.entries(queries).map(async ([key, sql]) => {
        const { rows } = await db.query(sql);
        return [
          key,
          rows
            .map((r) => r.val)
            .filter((val) => val)
            .sort(),
        ];
      }),
    );

    const options = Object.fromEntries(results);

    // Fallback default
    if (options.statuses.length === 0)
      options.statuses = ["OPERATED", "IDLE", "MAINTENANCE", "PROBLEM"];
    if (options.roles.length === 0)
      options.roles = ["admin", "officer", "user"];
    if (options.deviceTypes.length === 0)
      options.deviceTypes = ["Router", "OLT", "Switch"];

    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    handleError(res, error, "Gagal mengambil opsi data");
  }
};

exports.getDevices = async (req, res) => {
  try {
    const { search, division, sto, area, status } = req.query || {};
    let query = "SELECT * FROM inventory_devices WHERE 1=1";
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(device_id) LIKE $${params.length} OR LOWER(serial_number) LIKE $${params.length})`;
    }
    if (division) {
      params.push(division);
      query += ` AND division = $${params.length}`;
    }
    if (sto) {
      params.push(sto);
      query += ` AND sto = $${params.length}`;
    }
    if (area) {
      params.push(area);
      query += ` AND area = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += " ORDER BY created_at DESC";
    const { rows } = await db.query(query, params);

    res.json({
      success: true,
      data: { items: rows.map(mapDeviceFromDB), total: rows.length },
    });
  } catch (error) {
    handleError(res, error, "Gagal mengambil data perangkat");
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
      kind,
      division,
      area,
      sto,
      totalPort,
      idlePort,
    } = req.body;

    const query = `
      INSERT INTO inventory_devices (
        device_id, ip, name, device_type, storage_location, 
        serial_number, status, room, kind, division, area, sto, 
        total_port, idle_port
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
      kind,
      division,
      area,
      sto,
      totalPort || 0,
      idlePort || 0,
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
      deviceId,
      ip,
      name,
      deviceType,
      storageLocation,
      serialNumber,
      status,
      room,
      kind,
      division,
      area,
      sto,
      totalPort,
      idlePort,
    } = req.body;

    const query = `
      UPDATE inventory_devices SET
        device_id = $1, ip = $2, name = $3, device_type = $4, 
        storage_location = $5, serial_number = $6, status = $7, room = $8, 
        kind = $9, division = $10, area = $11, sto = $12, 
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
      kind,
      division,
      area,
      sto,
      totalPort,
      idlePort,
      id,
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
    const { rows } = await db.query(
      "SELECT id, username, name, email, nik, role, division, area, status FROM users ORDER BY created_at DESC",
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error, "Gagal mengambil data user");
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, name, email, nik, role, division, area } =
      req.body;
    const query = `
      INSERT INTO users (username, password, name, email, nik, role, division, area, status)
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
      division,
      area,
    ]);
    res.json({ success: true, message: "User berhasil dibuat" });
  } catch (error) {
    handleError(res, error, "Gagal membuat user");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, nik, role, division, area } = req.body;
    const query = `
      UPDATE users SET 
        name = $1, email = $2, nik = $3, role = $4, division = $5, area = $6,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $7
    `;
    const { rowCount } = await db.query(query, [
      name,
      email,
      nik,
      role,
      division,
      area,
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
    const { id } = req.params;
    const { rows } = await db.query("SELECT status FROM users WHERE id = $1", [
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
    const { rows } = await db.query(
      "SELECT id, username, name, email, nik, role, division, area, status FROM users WHERE id = $1",
      [id],
    );

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
    const { name, email, nik, division, area } = req.body;

    const query = `
      UPDATE users SET 
        name = $1, email = $2, nik = $3, division = $4, area = $5,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $6
      RETURNING id, username, name, email, nik, role, division, area, status
    `;
    const { rows } = await db.query(query, [
      name,
      email,
      nik,
      division,
      area,
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    res.json({
      success: true,
      data: rows[0],
      message: "Profil berhasil diperbarui",
    });
  } catch (error) {
    handleError(res, error, "Gagal memperbarui profil");
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const { division, area } = req.query;
    let whereClause = "WHERE 1=1";
    const params = [];

    if (division) {
      params.push(division);
      whereClause += ` AND division = $${params.length}`;
    }
    if (area) {
      params.push(area);
      whereClause += ` AND area = $${params.length}`;
    }

    const userCount = await db.query(`SELECT COUNT(*) FROM users ${division ? 'WHERE division = $1' : ''}`, division ? [division] : []);
    
    // Fix: Ensure we don't have dangling WHERE/AND without conditions
    const deviceWhere = whereClause === "WHERE 1=1" ? "" : whereClause.replace("WHERE 1=1 AND ", "WHERE ");
    const deviceCount = await db.query(`SELECT COUNT(*) FROM inventory_devices ${deviceWhere}`, params);
    
    // For units (STO), scope it by area if provided
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
