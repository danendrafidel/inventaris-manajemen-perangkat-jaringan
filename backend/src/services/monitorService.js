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
      message += `   🔢 SN: <code>${report.serial_number}</code>\n`;
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

// Global flag to prevent concurrent executions
let isChecking = false;

const checkDevices = async () => {
  if (isChecking) return;
  isChecking = true;

  try {
    const { rows: devices } = await db.query(
      "SELECT id, device_id, name, ip, area, sto, connectivity_status, failure_count, last_notification_status FROM inventory_devices WHERE ip IS NOT NULL AND ip != ''",
    );

    // Process all devices in parallel
    await Promise.all(
      devices.map(async (device) => {
        try {
          const pingResult = await pingIP(device.ip);
          const previousStatus = device.connectivity_status;
          const lastNotif = device.last_notification_status;
          let newFailureCount = device.failure_count || 0;
          let currentStatus = previousStatus;
          let currentNotif = lastNotif;

          if (pingResult === "offline") {
            newFailureCount++;
            if (newFailureCount >= 5) {
              currentStatus = "offline";

              if (lastNotif !== "offline") {
                const message =
                  `🚨 <b>PERANGKAT DOWN</b> 🚨\n\n` +
                  `<b>Nama:</b> ${device.name}\n` +
                  `<b>ID:</b> ${device.device_id}\n` +
                  `<b>IP:</b> <code>${device.ip}</code>\n` +
                  `<b>Lokasi:</b> ${device.area} - ${device.sto}\n\n` +
                  `⚠️ Segera lakukan pengecekan! (Terdeteksi RTO 5x)`;

                await sendTelegramMessage(message);
                currentNotif = "offline";
              }
            }
          } else {
            newFailureCount = 0;
            currentStatus = "online";

            if (lastNotif === "offline") {
              const message =
                `✅ <b>PERANGKAT KEMBALI ONLINE</b> ✅\n\n` +
                `<b>Nama:</b> ${device.name}\n` +
                `<b>ID:</b> ${device.device_id}\n` +
                `<b>IP:</b> <code>${device.ip}</code>\n` +
                `<b>Lokasi:</b> ${device.area} - ${device.sto}\n\n` +
                `🕒 Perangkat sudah dapat diakses kembali.`;

              await sendTelegramMessage(message);
              currentNotif = "online";
            } else if (!lastNotif) {
              currentNotif = "online";
            }
          }

          if (
            currentStatus !== previousStatus ||
            newFailureCount !== device.failure_count ||
            currentNotif !== lastNotif
          ) {
            await db.query(
              "UPDATE inventory_devices SET connectivity_status = $1, failure_count = $2, last_notification_status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4",
              [currentStatus, newFailureCount, currentNotif, device.id],
            );
          }
        } catch (deviceError) {
          console.error(`Error checking device ${device.ip}:`, deviceError);
        }
      }),
    );
  } catch (error) {
    console.error("Monitor service error:", error);
  } finally {
    isChecking = false;
  }
};

const startMonitoring = (intervalMs = 1000) => {
  console.log(`Starting background monitoring every ${intervalMs / 1000}s...`);

  const run = async () => {
    await checkDevices();
    setTimeout(run, intervalMs);
  };

  run();

  // Schedule daily summary at 20:00
  cron.schedule("0 20 * * *", () => {
    sendDailyPMRSummary();
  });
};

module.exports = { startMonitoring, pingIP };
