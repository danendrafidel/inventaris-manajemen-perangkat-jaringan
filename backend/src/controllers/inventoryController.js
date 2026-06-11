const db = require("../config/db");
const cache = require("../config/cache");
const { exec } = require("child_process");
const { lastStatus } = require("../services/monitorService");
const {
  handleError,
  mapDeviceFromDB,
  invalidateAllStats,
} = require("../utils/helper");

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
        db.query("SELECT DISTINCT role FROM users WHERE role != 'root'"),
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

    const [totalDevices, statusBaik, perluPerhatian, areaTercover, onlineStatus, offlineStatus] =
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
          `SELECT COUNT(*) FROM inventory_devices ${whereClause} ${area_id ? "AND" : "WHERE"} status IN ('MAINTENANCE', 'PROBLEM', 'RUSAK')`,
          params,
        ),
        db.query(
          `SELECT COUNT(DISTINCT area_id) FROM inventory_devices ${whereClause}`,
          params,
        ),
        db.query(
          `SELECT COUNT(*) FROM inventory_devices ${whereClause} ${area_id ? "AND" : "WHERE"} connectivity_status = 'online'`,
          params,
        ),
        db.query(
          `SELECT COUNT(*) FROM inventory_devices ${whereClause} ${area_id ? "AND" : "WHERE"} connectivity_status = 'offline'`,
          params,
        ),
      ]);

    const data = {
      stats: {
        totalDevices: parseInt(totalDevices.rows[0].count),
        statusBaik: parseInt(statusBaik.rows[0].count),
        perluPerhatian: parseInt(perluPerhatian.rows[0].count),
        areaTercoverCount: parseInt(areaTercover.rows[0].count),
        onlineCount: parseInt(onlineStatus.rows[0].count),
        offlineCount: parseInt(offlineStatus.rows[0].count),
      },
    };

    cache.set(cacheKey, data, 30000); // 30 seconds TTL for stats
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, "Gagal memuat statistik inventaris");
  }
};

exports.fetchInventoryDevices = async (req, res) => {
  try {
    const { search, sto_id, area_id, status, connectivity_status, page, limit } = req.query;
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
    if (connectivity_status) {
      params.push(connectivity_status);
      where.push(`i.connectivity_status = $${params.length}`);
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
        area, sto, total_port, idle_port, connectivity_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
      'unknown'
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

exports.pingDevices = async (req, res) => {
  try {
    const { ips } = req.body;
    if (!ips || !Array.isArray(ips)) {
      return res
        .status(400)
        .json({ success: false, message: "Daftar IP diperlukan" });
    }

    const results = await Promise.all(
      ips.map((ip) => {
        return new Promise((resolve) => {
          const command =
            process.platform === "win32"
              ? `ping -n 1 -w 1000 ${ip}`
              : `ping -c 1 -W 1 ${ip}`;

          exec(command, (error) => {
            resolve({ ip, status: !error ? "online" : "offline" });
          });
        });
      }),
    );

    res.json({ success: true, data: results });
  } catch (error) {
    handleError(res, error, "Gagal melakukan pengecekan koneksi perangkat");
  }
};
