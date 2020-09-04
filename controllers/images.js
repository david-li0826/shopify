const fs = require('fs');
const Fuse = require('fuse.js');

exports.addImagePage = (req, res) => {
    res.render('add-image.ejs', {
        title: "Welcome to Shopify Intern Challenge - Add Images",
        message: ''
    })
}

async function label(imgname) {
    const vision = require('@google-cloud/vision');

    // create a client
    const client = new vision.ImageAnnotatorClient();

    // performs label detection on the image file
    const [result] = await client.labelDetection(`public/assets/images/${imgname}`);
    const labels = result.labelAnnotations;
    console.log('Labels:');
    let tags = [];
    labels.forEach(label => {
        console.log(label.description)
        tags.push(label.description)
    });
    return tags.join(',');
}

function dbadd(req, res, image_name, fileExtension, tags) {
    let query = "INSERT INTO `image` (imgname, imgtype, imgtag) VALUES ('" + image_name + "', '" + fileExtension + "', '" + tags + "')";
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
    let tags = '';

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
            // upload the file to the /public/assets/images dir
            fs.writeFile(`public/assets/images/${image_name}`, uploadedFile, {encoding: 'base64'}, function (err) {
                if (err) {
                    console.log('File creation error');
                    return res.status(500).send(err);
                }
                console.log('File created');
                label(image_name)
                    .then(result => {
                        console.log(image_name + ': ' + result);
                        dbadd(req, res, image_name, fileExtension, result);
                    })
                    .catch(err => {
                        console.log(err);
                        dbadd(req, res, image_name, fileExtension, tags);
                    })
            });
        }
    });
}

exports.deleteImage = (req, res) => {
    let imgid = req.params.id;
    let getImageQuery = 'SELECT imgname FROM `image` WHERE imgid = "' + imgid + '"';
    let deleteQuery = 'DELETE FROM `image` WHERE imgid = "' + imgid + '"';

    db.query(getImageQuery, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }

        let image = result[0].imgname;

        fs.unlink(`public/assets/images/${image}`, (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            db.query(deleteQuery, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }
                res.redirect('/');
            })
        })
    })
}

exports.searchImageByText = (req, res) => {
    let t = req.body.searchText;
    if (!t || t === '') {
        return res.status(400).send("Nothing to search for!");
    }

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

exports.searchImageByImage = (req, res) => {
    if (!req.files) {
        return res.status(400).send("No Images were uploaded");
    }

    let image = req.files.image;
    let fileExt = image.mimetype.split('/')[1];
    let imgname = 'temporary_search_image.' + fileExt;

    image.mv(`public/assets/images/${imgname}`, function (err) {
        if (err) {
            console.log('File creation error');
            return res.status(500).send(err);
        }
        console.log('File created');
        label(imgname)
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
                        const minlen = listOfSearchTags.length < 2 ? listOfSearchTags.length : 2;
                        for (let i = 0; i < minlen; i++) {
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
            })
    });
}