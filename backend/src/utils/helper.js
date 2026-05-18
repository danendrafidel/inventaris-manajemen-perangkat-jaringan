const cache = require("../config/cache");

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

module.exports = {
  mapDeviceFromDB,
  handleError,
  invalidateAllStats,
};
