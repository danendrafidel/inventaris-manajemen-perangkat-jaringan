const db = require("../config/db");
const cache = require("../config/cache");
const { handleError } = require("../utils/helper");

exports.getDashboard = async (req, res) => {
  try {
    const { area_id, user_id } = req.query;

    // Update last_activity if user_id is provided
    if (user_id) {
      await db.query(
        "UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = $1",
        [user_id],
      );
    }

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

    // Count online users (active in the last 2 minutes)
    let userQuery =
      "SELECT COUNT(*) FROM users WHERE last_activity > CURRENT_TIMESTAMP - INTERVAL '2 minutes'";
    let userParams = [];
    if (area_id) {
      userQuery += " AND area_id = $1";
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

    const onlineDevices = await db.query(
      `SELECT COUNT(*) FROM inventory_devices ${deviceWhere} ${deviceWhere ? "AND" : "WHERE"} connectivity_status = 'online'`,
      params,
    );

    const offlineDevices = await db.query(
      `SELECT COUNT(*) FROM inventory_devices ${deviceWhere} ${deviceWhere ? "AND" : "WHERE"} connectivity_status = 'offline'`,
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
        onlineDevices: parseInt(onlineDevices.rows[0].count),
        offlineDevices: parseInt(offlineDevices.rows[0].count),
        totalAreas: parseInt(areaCount.rows[0].count),
        units: parseInt(stoCount.rows[0].count),
      },
      meta: {
        usersSuffix: "online",
        devicesSuffix: "online",
        areasSuffix: "areas",
        unitsSuffix: "units",
      },
    };

    cache.set(cacheKey, data, 30000); // 30 seconds TTL
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, "Gagal mengambil data dashboard");
  }
};
