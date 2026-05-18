const db = require("../config/db");
const { handleError, invalidateAllStats } = require("../utils/helper");

exports.getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.username, u.name, u.email, u.nik, u.role, u.area_id, u.status, u.office_id,
             a.name as area,
             o.name as kantor, o.latitude as kantor_latitude, o.longitude as kantor_longitude
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN offices o ON u.office_id = o.id
      ORDER BY u.created_at DESC
    `;
    const { rows } = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error, "Gagal mengambil data user");
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, name, email, nik, role, area_id, office_id } =
      req.body;

    const final_area_id = area_id && area_id !== "" ? parseInt(area_id) : null;
    const final_office_id =
      office_id && office_id !== "" ? parseInt(office_id) : null;

    let area_name = null;
    let office_name = null;

    if (final_area_id) {
      const areaRes = await db.query("SELECT name FROM areas WHERE id = $1", [
        final_area_id,
      ]);
      if (areaRes.rows.length > 0) area_name = areaRes.rows[0].name;
    }
    if (final_office_id) {
      const officeRes = await db.query(
        "SELECT name FROM offices WHERE id = $1",
        [final_office_id],
      );
      if (officeRes.rows.length > 0) office_name = officeRes.rows[0].name;
    }

    const query = `
      INSERT INTO users (username, password, name, email, nik, role, area_id, office_id, area, kantor, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
      RETURNING id
    `;
    await db.query(query, [
      username,
      password,
      name,
      email,
      nik,
      role,
      final_area_id,
      final_office_id,
      area_name,
      office_name,
    ]);

    invalidateAllStats();
    res.json({ success: true, message: "User berhasil dibuat" });
  } catch (error) {
    handleError(res, error, "Gagal membuat user");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, nik, role, area_id, office_id } = req.body;

    const final_area_id = area_id && area_id !== "" ? parseInt(area_id) : null;
    const final_office_id =
      office_id && office_id !== "" ? parseInt(office_id) : null;

    let area_name = null;
    let office_name = null;

    if (final_area_id) {
      const areaRes = await db.query("SELECT name FROM areas WHERE id = $1", [
        final_area_id,
      ]);
      if (areaRes.rows.length > 0) area_name = areaRes.rows[0].name;
    }
    if (final_office_id) {
      const officeRes = await db.query(
        "SELECT name FROM offices WHERE id = $1",
        [final_office_id],
      );
      if (officeRes.rows.length > 0) office_name = officeRes.rows[0].name;
    }

    const query = `
      UPDATE users SET 
        name = $1, email = $2, nik = $3, role = $4, area_id = $5, office_id = $6,
        area = $7, kantor = $8,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $9
    `;
    const { rowCount } = await db.query(query, [
      name,
      email,
      nik,
      role,
      final_area_id,
      final_office_id,
      area_name,
      office_name,
      id,
    ]);

    if (rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    invalidateAllStats();
    res.json({ success: true, message: "User berhasil diperbarui" });
  } catch (error) {
    handleError(res, error, "Gagal memperbarui user");
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const { rowCount } = await db.query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [password, id],
    );

    if (rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    res.json({ success: true, message: "Password berhasil diganti" });
  } catch (error) {
    handleError(res, error, "Gagal mengganti password");
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "SELECT status, username FROM users WHERE id = $1",
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    const newStatus = rows[0].status === "active" ? "inactive" : "active";
    await db.query(
      "UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newStatus, id],
    );

    invalidateAllStats();
    res.json({ success: true, message: `User berhasil ${newStatus}` });
  } catch (error) {
    handleError(res, error, "Gagal mengubah status user");
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT u.id, u.username, u.name, u.email, u.nik, u.role, u.area_id, u.status, u.office_id,
             a.name as area,
             o.name as kantor, o.latitude as kantor_latitude, o.longitude as kantor_longitude
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN offices o ON u.office_id = o.id
      WHERE u.id = $1
    `;
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    handleError(res, error, "Gagal mengambil profil");
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, nik, area_id, office_id } = req.body;

    const final_area_id = area_id && area_id !== "" ? parseInt(area_id) : null;
    const final_office_id =
      office_id && office_id !== "" ? parseInt(office_id) : null;

    let area_name = null;
    let office_name = null;

    if (final_area_id) {
      const areaRes = await db.query("SELECT name FROM areas WHERE id = $1", [
        final_area_id,
      ]);
      if (areaRes.rows.length > 0) area_name = areaRes.rows[0].name;
    }
    if (final_office_id) {
      const officeRes = await db.query(
        "SELECT name FROM offices WHERE id = $1",
        [final_office_id],
      );
      if (officeRes.rows.length > 0) office_name = officeRes.rows[0].name;
    }

    const query = `
      UPDATE users SET 
        name = $1, email = $2, nik = $3, area_id = $4, office_id = $5,
        area = $6, kantor = $7,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $8
      RETURNING id, username, name, email, nik, role, area_id, office_id, area, kantor, status
    `;
    const { rows } = await db.query(query, [
      name,
      email,
      nik,
      final_area_id,
      final_office_id,
      area_name,
      office_name,
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    invalidateAllStats();
    res.json({
      success: true,
      data: rows[0],
      message: "Profil berhasil diperbarui",
    });
  } catch (error) {
    handleError(res, error, "Gagal memperbarui profil");
  }
};
