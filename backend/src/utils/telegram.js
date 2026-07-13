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

const normalizeArea = (area) => (area || "").trim().toLowerCase();

const getTargetChatIds = (area) => {
  const normalized = normalizeArea(area);
  if (!normalized) return [process.env.TELEGRAM_CHAT_ID_1, process.env.TELEGRAM_CHAT_ID_2].filter(Boolean);
  if (GROUP2_AREAS.some((a) => normalizeArea(a) === normalized)) return [process.env.TELEGRAM_CHAT_ID_2].filter(Boolean);
  return [process.env.TELEGRAM_CHAT_ID_1].filter(Boolean);
};

const escapeHTML = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const sendTelegramMessage = async (message, area = null) => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("Telegram Bot Token not configured");
    return false;
  }

  const chatIds = getTargetChatIds(area);
  console.log(`[TELEGRAM] sendTelegramMessage called area="${area}" chatIds=${JSON.stringify(chatIds)}`);
  if (chatIds.length === 0) {
    console.warn("No Telegram Chat IDs configured for area:", area);
    return false;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  let anySuccess = false;

  for (const chat_id of chatIds) {
    try {
      console.log(`[TELEGRAM] Posting to chat_id=${chat_id}...`);
      await axios.post(url, { chat_id, text: message, parse_mode: "HTML" });
      console.log(`[TELEGRAM] Success for chat_id=${chat_id}`);
      anySuccess = true;
    } catch (error) {
      console.error(`[TELEGRAM] Error to ${chat_id}:`, error.response?.data || error.message);
    }
  }

  return anySuccess;
};

module.exports = { sendTelegramMessage, escapeHTML };
