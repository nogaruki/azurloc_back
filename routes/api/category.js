const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/categoryController');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyRoles = require('../../middleware/verifyRoles');
router.route('/')
    .get(categoryController.getAll)
    .post([verifyJWT, verifyRoles(2002)],categoryController.create);

router.route('/:id')
    .get(categoryController.getOne)
    .put([verifyJWT, verifyRoles(2002)], categoryController.update)
    .delete([verifyJWT, verifyRoles(2002)], categoryController.remove);




module.exports = router;

