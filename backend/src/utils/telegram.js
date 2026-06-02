const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_IDS = [process.env.TELEGRAM_CHAT_ID_1, process.env.TELEGRAM_CHAT_ID_2].filter(Boolean);

const sendTelegramMessage = async (message) => {
  if (!TELEGRAM_BOT_TOKEN || CHAT_IDS.length === 0) {
    console.warn("Telegram Bot Token or Chat IDs not configured");
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  for (const chat_id of CHAT_IDS) {
    try {
      await axios.post(url, {
        chat_id: chat_id,
        text: message,
        parse_mode: "HTML",
      });
    } catch (error) {
      console.error(
        `Error sending Telegram message to ${chat_id}:`,
        error.response?.data || error.message,
      );
    }
  }
};

module.exports = { sendTelegramMessage };
