const fs = require('fs');
const Fuse = require('fuse.js');
const stream = require('stream');
const {format} = require('util');

exports.addImagePage = (req, res) => {
    res.render('add-image.ejs', {
        title: "Welcome to Shopify Intern Challenge - Add Images",
        message: ''
    })
}

async function label(publicUrl, maxres) {
    const vision = require('@google-cloud/vision');
    console.log(publicUrl);

    // create a client
    const client = new vision.ImageAnnotatorClient();

    let request = {
        "image":{
            "source": {
                "imageUri":publicUrl
            }
        },
        "features":[
            {
                "type":"LABEL_DETECTION",
                "maxResults":maxres
            }
        ]
    }

    // performs label detection on the image file
    const [result] = await client.annotateImage(request);
    const labels = result.labelAnnotations;
    console.log('Labels:');
    let tags = [];
    labels.forEach(label => {
        console.log(label.description)
        tags.push(label.description)
    });
    return tags.join(',');
}

function dbadd(req, res, image_name, fileExtension, tags, publicUrl) {
    let query = "INSERT INTO `image` (imgname, imgtype, imgtag, imgurl) VALUES ('" + image_name + "', '" + fileExtension + "', '" + tags + "', '" + publicUrl + "')";
    db.query(query, (err, result) => {
        if (err) {
            console.log('DB error');
            return res.status(500).send(err);
        }
        console.log('DB entry created');
    });
    return res.status(200).send('Image upload complete');
}

exports.addImage = async (req, res) => {
    if (!req.body.image || !req.body.name) {
        return res.status(400).send("No images were uploaded");
    }

    let message = '';
    let uploadedFile = req.body.image;
    let image_name = req.body.name;
    let fileExtension = req.body.type;

    let imgnameQuery = "SELECT imgid FROM `image` WHERE imgname = '" + image_name + "'";

    db.query(imgnameQuery, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        if (result.length > 0) {
            message = 'Image with that image name already exists';
            return res.status(200).send(message);
        } else {
            let bufferStream = new stream.PassThrough();
            bufferStream.end(Buffer.from(uploadedFile, 'base64'));
            const blob = bucket.file(image_name);
            bufferStream.pipe(blob.createWriteStream({
                resumable: false,
                public: true
                }))
                .on('error', function (err) {
                    console.log('File creation error: ' + err);
                    return res.status(500).send(err);
                })
                .on('finish', function () {
                    console.log('File created');
                    const publicUrl = format(
                        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
                    );
                    label(publicUrl, 3)
                        .then(result => {
                            console.log(image_name + ': ' + result);
                            dbadd(req, res, image_name, fileExtension, result, publicUrl);
                        })
                        .catch(err => {
                            console.log(err);
                            dbadd(req, res, image_name, fileExtension, '', publicUrl);
                        })
                });
        }
    });
}

async function deleteFile(filename) {
    await bucket.file(filename).delete({
        force: true
    });
    console.log('File deleted from Google Cloud Storage');
}

exports.deleteImage = (req, res) => {
    let imgid = req.params.id;
    let getImageQuery = 'SELECT imgname FROM `image` WHERE imgid = "' + imgid + '"';
    let deleteQuery = 'DELETE FROM `image` WHERE imgid = "' + imgid + '"';

    db.query(getImageQuery, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }

        if (result.length === 0) {
            return res.status(404).send('Image not found in DB');
        }

        let image = result[0].imgname;

        deleteFile(image)
            .then(() => {
                db.query(deleteQuery, (err, result) => {
                    if (err) {
                        console.log('DB delete entry error: ' + err);
                        return res.status(500).send('DB delete entry error');
                    }
                    res.redirect('/');
                });
            })
            .catch((err) => {
                console.log('File deletion from Google Cloud Storage error: ' + err);
                return res.status(500).send('File deletion from Google Cloud Storage error');
            });
    })
}

exports.searchImageByText = (req, res) => {
    let t = req.body.searchText;
    if (!t || t === '') {
        console.log('Nothing to search for!');
        return res.render('search', {
            title: "Welcome to Shopify Intern Challenge - Search Images",
            images: []
        });
    }

    let query = "SELECT * FROM `image` ORDER BY imgid ASC";

    db.query(query, (err, result) => {
        if (err || result.length <= 0) {
            return res.render('search', {
                title: "Welcome to Shopify Intern Challenge - Search Images",
                images: []
            });
        }
        let list = [];
        result.forEach((image, index) => {
            let imgid = image.imgid;
            let tags = image.imgtag.split(',');
            tags.push(image.imgname.split('.')[0]);
            const fuse = new Fuse(tags);
            let len = t.length - 1;
            const options = {
                thresholds: 0.01,
                minMatchCharLength: len,
                includeScore: true
            }
            const fuzzy = fuse.search(t, options);
            console.log(fuzzy);
            if (fuzzy.length > 0) {
                list.push(imgid);
            }
        });
        if (list.length > 0) {
            console.log('Matched list: ' + list);
            db.query('SELECT * FROM `image` where imgid IN (?)', [list], (err, images) => {
                if (err) {
                    res.redirect('/');
                }
                res.render('search', {
                    title: "Welcome to Shopify Intern Challenge - Search Images",
                    images: images
                });
            });
        } else {
            res.render('search', {
                title: "Welcome to Shopify Intern Challenge - Search Images",
                images: []
            });
        }
    });
}

async function labelTmp(tmpPath, maxres) {
    const vision = require('@google-cloud/vision');
    console.log(tmpPath);

    // create a client
    const client = new vision.ImageAnnotatorClient();

    let request = {
        "image":{
            "source": {
                "filename":tmpPath
            }
        },
        "features":[
            {
                "type":"LABEL_DETECTION",
                "maxResults":maxres
            }
        ]
    }

    // performs label detection on the image file
    const [result] = await client.annotateImage(request);
    const labels = result.labelAnnotations;
    console.log('Labels:');
    let tags = [];
    labels.forEach(label => {
        console.log(label.description)
        tags.push(label.description)
    });
    return tags.join(',');
}

exports.searchImageByImage = (req, res) => {
    if (!req.files) {
        return res.status(400).send("No Images were uploaded");
    }

    let image = req.files.image;
    let fileExt = image.mimetype.split('/')[1];
    let imgname = 'temporary_search_image.' + fileExt;

    image.mv(`/tmp/${imgname}`, function (err) {
        if (err) {
            console.log('Tmp File creation error');
            return res.status(500).send(err);
        }
        console.log('File created');
        labelTmp(`/tmp/${imgname}`, 2)
            .then(result => {
                console.log(imgname + ': ' + result);
                let listOfSearchTags = result.split(',');

                let query = "SELECT * FROM `image` ORDER BY imgid ASC";

                db.query(query, (err, result) => {
                    if (err || result.length <= 0) {
                        res.redirect('/');
                    }
                    let list = [];
                    result.forEach((image, index) => {
                        let imgid = image.imgid;
                        let tags = image.imgtag.split(',');
                        tags.push(image.imgname.split('.')[0]);
                        const fuse = new Fuse(tags);
                        for (let i = 0; i < listOfSearchTags.length; i++) {
                            let t = listOfSearchTags[i];
                            let len = t.length - 1;
                            const options = {
                                thresholds: 0.01,
                                minMatchCharLength: len,
                                includeScore: true
                            }
                            const fuzzy = fuse.search(t, options);
                            console.log(fuzzy);
                            if (fuzzy.length > 0) {
                                list.push(imgid);
                            }
                        }
                    });
                    if (list.length > 0) {
                        console.log('Matched list: ' + list);
                        db.query('SELECT * FROM `image` where imgid IN (?)', [list], (err, images) => {
                            if (err) {
                                res.redirect('/');
                            }
                            res.render('search', {
                                title: "Welcome to Shopify Intern Challenge - Search Images",
                                images: images
                            });
                        });
                    } else {
                        res.render('search', {
                            title: "Welcome to Shopify Intern Challenge - Search Images",
                            images: []
                        });
                    }
                });
            })
            .catch(err => {
                console.log(err);
            });
    });
}