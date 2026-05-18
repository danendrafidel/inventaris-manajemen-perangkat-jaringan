const db = require("../config/db");
const cache = require("../config/cache");
const { handleError } = require("../utils/helper");

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
