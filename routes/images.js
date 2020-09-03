const fs = require('fs');
const express = require('express');
const router = express.Router();

const imageController = require('../controllers/images')

/* add image page */
router.get('/upload', imageController.addImagePage);

/* add image to DB */
router.post('/upload', imageController.addImage);

module.exports = router;
