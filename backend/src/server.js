require("dotenv").config();
const app = require("./app");
const { startMonitoring } = require("./services/monitorService");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend berjalan di http://localhost:${PORT}`);
  
  // Start monitoring devices for Telegram notifications (every 3 minutes)
  startMonitoring(180000);
});
