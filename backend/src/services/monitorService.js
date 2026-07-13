const db = require("../config/db");
const { exec } = require("child_process");
const { sendTelegramMessage, escapeHTML } = require("../utils/telegram");
const cron = require("node-cron");

const OFFLINE_THRESHOLD = 20;

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

let isChecking = false;

const checkDevices = async () => {
  if (isChecking) return;
  isChecking = true;

  try {
    const { rows: devices } = await db.query(
      "SELECT id, device_id, name, ip, area, sto, connectivity_status, failure_count, last_notification_status FROM inventory_devices WHERE ip IS NOT NULL AND ip != ''",
    );

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

            if (
              newFailureCount >= OFFLINE_THRESHOLD ||
              previousStatus === "offline"
            ) {
              currentStatus = "offline";

              if (lastNotif !== "offline") {
                console.log(`[MONITOR] Sending DOWN notif for ${device.name} (${device.ip}) area=${device.area} failureCount=${newFailureCount}`);
                const message =
                  `🚨 <b>PERANGKAT DOWN</b> 🚨\n\n` +
                  `<b>Nama:</b> ${escapeHTML(device.name)}\n` +
                  `<b>ID:</b> ${escapeHTML(device.device_id)}\n` +
                  `<b>IP:</b> <code>${escapeHTML(device.ip)}</code>\n` +
                  `<b>Lokasi:</b> ${escapeHTML(device.area)} - ${escapeHTML(device.sto)}\n\n` +
                  `⚠️ Segera lakukan pengecekan! (Terdeteksi RTO ${OFFLINE_THRESHOLD}x)`;

                const sent = await sendTelegramMessage(message, device.area);
                console.log(`[MONITOR] DOWN notif result for ${device.name}: sent=${sent}`);
                if (sent) {
                  currentNotif = "offline";
                }
              }
            }

            if (newFailureCount > OFFLINE_THRESHOLD) {
              newFailureCount = OFFLINE_THRESHOLD;
            }
          } else {
            newFailureCount = 0;
            currentStatus = "online";

            if (previousStatus === "offline" || lastNotif === "offline") {
              const message =
                `✅ <b>PERANGKAT KEMBALI ONLINE</b> ✅\n\n` +
                `<b>Nama:</b> ${escapeHTML(device.name)}\n` +
                `<b>ID:</b> ${escapeHTML(device.device_id)}\n` +
                `<b>IP:</b> <code>${escapeHTML(device.ip)}</code>\n` +
                `<b>Lokasi:</b> ${escapeHTML(device.area)} - ${escapeHTML(device.sto)}\n\n` +
                `🕒 Perangkat sudah dapat diakses kembali.`;

              const sent = await sendTelegramMessage(message, device.area);
              if (sent) {
                currentNotif = "online";
              }
            } else if (!previousStatus) {
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

const cleanupOldPmrReports = async () => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { rowCount } = await db.query(
      "DELETE FROM pmr_reports WHERE created_at < $1",
      [sixMonthsAgo.toISOString()],
    );

    if (rowCount > 0) {
      console.log(`[CLEANUP] Deleted ${rowCount} PMR report(s) older than 6 months`);
    }
  } catch (error) {
    console.error("[CLEANUP] Error cleaning old PMR reports:", error);
  }
};

const startMonitoring = (intervalMs = 1000) => {
  console.log(`Starting background monitoring every ${intervalMs / 1000}s...`);

  const run = async () => {
    await checkDevices();
    setTimeout(run, intervalMs);
  };

  run();

  cron.schedule("0 20 * * *", () => {
    sendDailyPMRSummary();
  });

  cron.schedule("0 3 * * *", () => {
    cleanupOldPmrReports();
  });
};

module.exports = { startMonitoring, pingIP };
