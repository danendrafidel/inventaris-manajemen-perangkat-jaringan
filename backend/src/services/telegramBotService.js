const { Telegraf } = require("telegraf");
const db = require("../config/db");
const { pingIP } = require("./monitorService");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Set bot commands menu
const setBotCommands = async () => {
  try {
    await bot.telegram.setMyCommands([
      {
        command: "info",
        description:
          "Mendapatkan informasi detail perangkat berdasarkan IP/ID/Nama/SN",
      },
      {
        command: "ping",
        description: "Melakukan pengecekan koneksi perangkat berdasarkan IP",
      },
    ]);
  } catch (error) {
    console.error("Failed to set bot commands:", error);
  }
};

bot.command("info", async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("Gunakan format: /info <IP/ID/Nama/SN Device>");
  }

  const query = args[1];
  try {
    const { rows } = await db.query(
      "SELECT * FROM inventory_devices WHERE ip = $1 OR device_id::text = $1 OR name = $1 OR serial_number = $1",
      [query],
    );

    if (rows.length === 0) {
      return ctx.reply(`Perangkat dengan kriteria ${query} tidak ditemukan.`);
    }

    const device = rows[0];
    const message =
      `ℹ️ <b>INFORMASI PERANGKAT</b> ℹ️\n\n` +
      `<b>ID:</b> ${device.device_id}\n` +
      `<b>Nama:</b> ${device.name}\n` +
      `<b>IP:</b> <code>${device.ip}</code>\n` +
      `<b>SN:</b> <code>${device.serial_number}</code>\n` +
      `<b>Status:</b> ${device.status}\n` +
      `<b>Lokasi:</b> ${device.area} - ${device.sto}`;

    ctx.replyWithHTML(message);
  } catch (error) {
    console.error("Bot error:", error);
    ctx.reply("Terjadi kesalahan saat mengambil informasi perangkat.");
  }
});

bot.command("ping", async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("Gunakan format: /ping <IP Device>");
  }

  const ip = args[1];
  try {
    ctx.reply(`Sedang melakukan ping ke ${ip}...`);

    const status = await pingIP(ip);

    ctx.reply(`Hasil ping untuk <b>${ip}</b>: <b>${status.toUpperCase()}</b>`, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Bot error:", error);
    ctx.reply("Terjadi kesalahan saat melakukan ping.");
  }
});

const startBot = () => {
  setBotCommands(); // Set commands on startup
  bot.launch().then(() => {});
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};

module.exports = { startBot };
