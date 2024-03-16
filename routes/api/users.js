const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const verifyJWT = require('../../middleware/verifyJWT');

router.route('/')
    .get(verifyJWT, userController.getInfo)
    .delete(verifyJWT, userController.deleteUser)
    .put(verifyJWT, userController.edit)

router.route('/cart')
    .get(verifyJWT, userController.getCart)
    .post(verifyJWT, userController.addToCart)
    .delete(verifyJWT, userController.removeFromCart);

router.route('/history')
    .get(verifyJWT, userController.getHistory)
    .post(verifyJWT, userController.addHistory);

router.route('/verify')
    .get(userController.emailVerification);

router.route('/resend')
    .get(userController.resendEmailVerification);

router.route('/cart')
    .get(verifyJWT, userController.getCart)
    .post(verifyJWT, userController.addToCart)
    .delete(verifyJWT, userController.removeFromCart);





module.exports = router;
