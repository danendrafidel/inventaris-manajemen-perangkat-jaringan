const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// User Management Routes
router.get("/users", userController.getAllUsers);
router.post("/users", userController.createUser);
router.put("/users/:id", userController.updateUser);
router.patch("/users/:id/password", userController.changePassword);
router.patch("/users/:id/status", userController.toggleUserStatus);

// Profile Routes
router.get("/profile/:id", userController.getProfile);
router.put("/profile/:id", userController.updateProfile);

module.exports = router;
