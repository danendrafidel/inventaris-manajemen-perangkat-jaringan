const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const GROUP1_AREAS = [
  "Witel BALI", "Witel JATIM BARAT", "Witel JATIM TIMUR",
  "Witel NUSRA (NTB)", "Witel NUSRA (NTT)", "Witel SURAMADU",
];

const GROUP2_AREAS = [
  "Witel SEMARANG", "Witel SEMARANG JATENG UTARA",
  "Witel SOLO JATENG TIMUR", "Witel YOGYA JATENG SELATAN",
];

const getTargetChatIds = (area) => {
  if (!area) return [process.env.TELEGRAM_CHAT_ID_1, process.env.TELEGRAM_CHAT_ID_2].filter(Boolean);
  if (GROUP2_AREAS.includes(area)) return [process.env.TELEGRAM_CHAT_ID_2].filter(Boolean);
  return [process.env.TELEGRAM_CHAT_ID_1].filter(Boolean);
};

const sendTelegramMessage = async (message, area = null) => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("Telegram Bot Token not configured");
    return false;
  }

  const chatIds = getTargetChatIds(area);
  if (chatIds.length === 0) {
    console.warn("No Telegram Chat IDs configured for area:", area);
    return false;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  let success = true;

  for (const chat_id of chatIds) {
    try {
      await axios.post(url, { chat_id, text: message, parse_mode: "HTML" });
    } catch (error) {
      console.error(`Telegram send error to ${chat_id}:`, error.response?.data || error.message);
      success = false;
    }
  }

  return success;
};

module.exports = { sendTelegramMessage };
