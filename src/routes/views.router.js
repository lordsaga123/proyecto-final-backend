const express = require("express");
const router = express.Router();
const ViewsController = require("../controllers/view.controller.js");
const viewsController = new ViewsController();
const checkUserRole = require("../middleware/cheackrole.js");
const passport = require("passport");

router.get("/products", checkUserRole(['usuario','premium']),passport.authenticate('jwt', { session: false }), viewsController.renderProducts.bind(viewsController));

router.get("/carts/:cid", viewsController.renderCart);
router.get("/login", viewsController.renderLogin);
router.get("/register", viewsController.renderRegister);
router.get("/realtimeproducts", checkUserRole(['admin','premium']), viewsController.renderRealTimeProducts);
router.get("/chat", checkUserRole(['usuario']) ,viewsController.renderChat);
router.get("/", viewsController.renderIndex);


//Reseteo de COntraseña
router.get("/resetpasswordconfirmation",viewsController.renderPasswordConfirmation);
router.get("/newpassword", viewsController.renderNewPassword);
router.get("/reset-password", viewsController.renderResetPassword);

//Venta de productos
router.get("/confirmacion-envio", viewsController.renderConfirmacion);

//Vista de Usuario Premium
router.get("/panel-premium", viewsController.renderPremium);




module.exports = router;
