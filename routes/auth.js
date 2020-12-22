var express = require('express');

var router = express.Router();

var authController = require('../controllers/auth')


const { upload } = require("../middleware/multer");
router.post("/login", upload.none(), authController.login);
router.post("/logout", upload.none(), authController.logout);
router.post("/validateToken", upload.none(), authController.validateToken);
router.post("/register", upload.none(), authController.register);
router.post("/verify", upload.none(), authController.verifyEmail);
router.post("/sendCode", upload.none(), authController.sendCode);
router.post("/resetPassword", upload.none(), authController.resetPassword);
router.post("/update", upload.single('imgFile'), authController.updateUser);
router.post("/updateMembership", upload.none(), authController.updateUserMembership);

module.exports = router;