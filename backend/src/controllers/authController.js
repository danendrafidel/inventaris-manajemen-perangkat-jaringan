const db = require("../config/db");
const mailer = require("../config/mailer");
const crypto = require("crypto");
const { handleError } = require("../utils/helper");

exports.login = async (req, res) => {
  try {
    const { identity, password } = req.body;
    const query = `
      SELECT u.id, u.username, u.name, u.email, u.nik, u.role, u.area_id, u.status, u.office_id,
             a.name as area_name,
             o.name as kantor, o.latitude as kantor_latitude, o.longitude as kantor_longitude
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN offices o ON u.office_id = o.id
      WHERE (u.username = $1 OR u.email = $1) AND u.password = $2 AND u.status = 'active'
    `;
    const { rows } = await db.query(query, [identity, password]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username/Email atau password salah",
      });
    }

    const user = rows[0];

    // Update last_activity
    await db.query(
      "UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id],
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        area: user.area_name,
        area_id: user.area_id,
        kantor: user.kantor,
        office_id: user.office_id,
        kantor_latitude: user.kantor_latitude,
        kantor_longitude: user.kantor_longitude,
      },
    });
  } catch (error) {
    handleError(res, error, "Gagal melakukan login");
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[ForgotPassword] Request for: ${email}`);

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email harus diisi" });
    }

    const { rows } = await db.query(
      "SELECT id, email, name FROM users WHERE email = $1",
      [email],
    );

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email tidak terdaftar" });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 jam dari sekarang

    // Simpan token ke database
    await db.query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3",
      [token, expires, email],
    );

    // Deteksi URL dasar secara dinamis
    const protocol =
      req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
    const host = req.headers["host"];
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;

    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Inventaris Manajemen" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Permintaan Reset Password",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Halo, ${user.name}</h2>
          <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
          <p>Silakan klik tombol di bawah ini untuk mereset password Anda:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Reset Password Saya</a>
          </div>
          <p style="font-size: 13px; color: #666;">Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
          <p style="font-size: 12px; color: #2563eb; word-break: break-all;">${resetLink}</p>
          <p style="font-size: 13px; color: #666; margin-top: 20px;">Link ini akan kadaluarsa dalam 1 jam.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999; text-align: center;">Sistem Manajemen Inventaris Perangkat Jaringan</p>
        </div>
      `,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("[MAILER ERROR] Konfigurasi SMTP belum lengkap");
      return res.status(500).json({
        success: false,
        message: "Konfigurasi server email belum lengkap. Hubungi Admin.",
      });
    }

    await mailer.sendMail(mailOptions);
    res.json({
      success: true,
      message: "Link reset password telah dikirim ke email Anda",
    });
  } catch (error) {
    handleError(res, error, "Gagal mengirim email reset password");
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Cari user berdasarkan token dan pastikan belum expired
    const { rows } = await db.query(
      "SELECT id, email FROM users WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP",
      [token],
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Link reset tidak valid atau sudah kadaluarsa",
      });
    }

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 6 karakter",
      });
    }

    await db.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [newPassword, rows[0].id],
    );

    res.json({
      success: true,
      message: "Password berhasil direset. Silakan login dengan password baru.",
    });
  } catch (error) {
    handleError(res, error, "Gagal mereset password");
  }
};
