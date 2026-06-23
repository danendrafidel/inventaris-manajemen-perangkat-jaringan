require("dotenv").config();
const app = require("./app");
const { startMonitoring } = require("./services/monitorService");
const { startBot } = require("./services/telegramBotService");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend berjalan di http://localhost:${PORT}`);

  // Start monitoring devices for Telegram notifications (every 1 second)
  startMonitoring(1000);
  // Start Telegram bot for command interactions
  if (process.env.TELEGRAM_BOT_TOKEN) {
    startBot();
  } else {
    console.log("Telegram bot token not configured, skipping bot startup");
  }
});
