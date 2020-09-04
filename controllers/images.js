const fs = require('fs');

exports.addImagePage = (req, res) => {
    res.render('add-image.ejs', {
        title: "Welcome to Shopify Intern Challenge - Add Images",
        message: ''
    })
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
                let query = "INSERT INTO `image` (imgname, imgtype, imgtag) VALUES ('" + image_name + "', '" + fileExtension + "', '" + tags + "')";
                db.query(query, (err, result) => {
                    if (err) {
                        console.log('DB error');
                        return res.status(500).send(err);
                    }
                    console.log('DB entry created');
                });
                return res.status(200).send('Image upload complete');
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
