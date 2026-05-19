const db = require("../config/db");
const { exec } = require("child_process");
const { sendTelegramMessage } = require("../utils/telegram");

// Store last status in memory to detect changes
const lastStatus = new Map();

const pingIP = (ip) => {
  return new Promise((resolve) => {
    const command =
      process.platform === "win32"
        ? `ping -n 1 -w 1000 ${ip}`
        : `ping -c 1 -W 1 ${ip}`;

    exec(command, (error) => {
      resolve(!error ? "online" : "offline");
    });
  });
};

const checkDevices = async () => {
  try {
    const { rows: devices } = await db.query(
      "SELECT id, device_id, name, ip, area, sto FROM inventory_devices WHERE ip IS NOT NULL AND ip != ''"
    );

    for (const device of devices) {
      const currentStatus = await pingIP(device.ip);
      const previousStatus = lastStatus.get(device.id);

      // Only notify if status changes from online (or unknown) to offline
      if (currentStatus === "offline" && (previousStatus === "online" || previousStatus === undefined)) {
        const message = `🚨 <b>PERANGKAT DOWN</b> 🚨\n\n` +
          `<b>Nama:</b> ${device.name}\n` +
          `<b>ID:</b> ${device.device_id}\n` +
          `<b>IP:</b> <code>${device.ip}</code>\n` +
          `<b>Lokasi:</b> ${device.area} - ${device.sto}\n\n` +
          `⚠️ Segera lakukan pengecekan!`;
        
        await sendTelegramMessage(message);
      } else if (currentStatus === "online" && previousStatus === "offline") {
        // Optional: Notify when device is back online
        const message = `✅ <b>PERANGKAT KEMBALI ONLINE</b> ✅\n\n` +
          `<b>Nama:</b> ${device.name}\n` +
          `<b>IP:</b> <code>${device.ip}</code>\n` +
          `🕒 Perangkat sudah dapat diakses kembali.`;
        
        await sendTelegramMessage(message);
      }

      lastStatus.set(device.id, currentStatus);
    }
  } catch (error) {
    console.error("Monitor service error:", error);
  }
};

const startMonitoring = (intervalMs = 300000) => { // Default 5 minutes
  console.log(`Starting background monitoring every ${intervalMs / 1000}s...`);
  // Run once immediately
  checkDevices();
  // Then set interval
  setInterval(checkDevices, intervalMs);
};

module.exports = { startMonitoring };
