const db = require('../config/db');

const handleError = (res, error, message = 'Internal Server Error') => {
  console.error("--- SETTINGS API ERROR ---");
  console.error("Message:", message);
  console.error("Error Detail:", error);
  res.status(500).json({ success: false, message, detail: error.message });
};

exports.getFuelSettings = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT key, value FROM settings WHERE key IN ('fuel_ratio', 'fuel_price_per_liter')");
    
    // Default values if not found
    const settings = {
      fuel_ratio: '12',
      fuel_price_per_liter: '10000'
    };

    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    handleError(res, error, 'Gagal mengambil pengaturan bensin');
  }
};

exports.updateFuelSettings = async (req, res) => {
  try {
    const { fuel_ratio, fuel_price_per_liter } = req.body;
    
    if (fuel_ratio === undefined || fuel_price_per_liter === undefined) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const queries = [
      db.query(
        "INSERT INTO settings (key, value, updated_at) VALUES ('fuel_ratio', $1, CURRENT_TIMESTAMP) " +
        "ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP",
        [fuel_ratio.toString()]
      ),
      db.query(
        "INSERT INTO settings (key, value, updated_at) VALUES ('fuel_price_per_liter', $1, CURRENT_TIMESTAMP) " +
        "ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP",
        [fuel_price_per_liter.toString()]
      )
    ];

    await Promise.all(queries);

    res.json({ success: true, message: 'Pengaturan bensin berhasil diperbarui' });
  } catch (error) {
    handleError(res, error, 'Gagal memperbarui pengaturan bensin');
  }
};
