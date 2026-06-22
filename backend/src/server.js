require("dotenv").config();
const app = require("./app");
const { runMigrations } = require("./config/migrate");
const { startMonitoring } = require("./services/monitorService");
const { startBot } = require("./services/telegramBotService");

const PORT = process.env.PORT || 3000;

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend berjalan di http://localhost:${PORT}`);

      // Start monitoring devices for Telegram notifications (every 1 second)
      startMonitoring(1000);
      // Start Telegram bot for command interactions
      startBot();
    });
  })
  .catch((error) => {
    console.error("Gagal menjalankan migrasi database:", error);
    process.exit(1);
  });
