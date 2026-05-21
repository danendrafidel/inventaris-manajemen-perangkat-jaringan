const db = require("../config/db");
const { exec } = require("child_process");
const { sendTelegramMessage } = require("../utils/telegram");
const cron = require("node-cron");

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

const sendDailyPMRSummary = async () => {
  try {
    const query = `
      SELECT p.*, u.name as technician_name, d.name as device_name, d.ip, d.serial_number, d.area, d.sto 
      FROM pmr_reports p
      JOIN users u ON p.user_id = u.id
      JOIN inventory_devices d ON p.device_id = d.id
      WHERE p.maintenance_date::date = CURRENT_DATE
    `;
    const { rows } = await db.query(query);

    if (rows.length === 0) return;

    let message = `📊 <b>RINGKASAN HARIAN PMR (${new Date().toLocaleDateString("id-ID")})</b> 📊\n\n`;
    message += `Total laporan hari ini: <b>${rows.length}</b>\n\n`;

    rows.forEach((report, index) => {
      message += `${index + 1}. <b>${report.device_name}</b>\n`;
      message += `   🆔 ID: ${report.device_id} | 🔢 SN: <code>${report.serial_number}</code>\n`;
      message += `   🌐 IP: <code>${report.ip}</code>\n`;
      message += `   📍 Lokasi: ${report.area} - ${report.sto}\n`;
      message += `   👤 Teknisi: ${report.technician_name}\n`;
      message += `   ✅ Status: ${report.status}\n`;
      message += `   📝 Catatan: ${report.notes || "-"}\n\n`;
    });

    await sendTelegramMessage(message);
  } catch (error) {
    console.error("Error sending daily PMR summary:", error);
  }
};

const checkDevices = async () => {
  try {
    const { rows: devices } = await db.query(
      "SELECT id, device_id, name, ip, area, sto FROM inventory_devices WHERE ip IS NOT NULL AND ip != ''",
    );

    for (const device of devices) {
      const currentStatus = await pingIP(device.ip);
      const previousStatus = lastStatus.get(device.id);

      // Only notify if status changes from online (or unknown) to offline
      if (
        currentStatus === "offline" &&
        (previousStatus === "online" || previousStatus === undefined)
      ) {
        const message =
          `🚨 <b>PERANGKAT DOWN</b> 🚨\n\n` +
          `<b>Nama:</b> ${device.name}\n` +
          `<b>ID:</b> ${device.device_id}\n` +
          `<b>IP:</b> <code>${device.ip}</code>\n` +
          `<b>Lokasi:</b> ${device.area} - ${device.sto}\n\n` +
          `⚠️ Segera lakukan pengecekan!`;

        await sendTelegramMessage(message);
      } else if (currentStatus === "online" && previousStatus === "offline") {
        // Optional: Notify when device is back online
        const message =
          `✅ <b>PERANGKAT KEMBALI ONLINE</b> ✅\n\n` +
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

const startMonitoring = (intervalMs = 120000) => {
  // Default 5 minutes
  console.log(`Starting background monitoring every ${intervalMs / 1000}s...`);
  // Run once immediately
  checkDevices();
  // Then set interval
  setInterval(checkDevices, intervalMs);

  // Schedule daily summary at 20:00
  cron.schedule("0 20 * * *", () => {
    sendDailyPMRSummary();
  });
};

module.exports = { startMonitoring };
