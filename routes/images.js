const fs = require('fs');
const express = require('express');
const router = express.Router();

const imageController = require('../controllers/images')

/* add image page */
router.get('/upload', imageController.addImagePage);

/* add image to DB */
router.post('/upload', imageController.addImage);

/* delete image */
router.get('/delete/:id', imageController.deleteImage);

/* search image by text */
router.post('/search', imageController.searchImageByText);

/* search image by image */
router.post('/searchByImage', imageController.searchImageByImage);

module.exports = router;
