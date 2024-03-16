const express = require('express');
const router = express.Router();
const activityController = require('../../controllers/activityController');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyRoles = require('../../middleware/verifyRoles');
router.route('/')
    .get(activityController.getAll)
    .post([verifyJWT, verifyRoles(2002)], activityController.create);

router.route('/:id')
    .get(activityController.getOne)
    .put([verifyJWT, verifyRoles(2002)], activityController.update)
    .delete([verifyJWT, verifyRoles(2002)], activityController.remove);




module.exports = router;

