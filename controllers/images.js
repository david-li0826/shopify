const fs = require('fs');

exports.addImagePage = (req, res) => {
    res.render('add-image.ejs', {
        title: "Welcome to Shopify Intern Challenge | Add Images",
        message: ''
    })
}

exports.addImage = async (req, res) => {
    if (!req.files) {
        return res.status(400).send("No files were uploaded");
    }

    let message = '';
    let uploadedFile = req.files.image;
    let image_name = uploadedFile.name;
    let fileExtension = uploadedFile.mimetype.split('/')[1];
    let tags = '';

    let imgnameQuery = "SELECT imgid FROM `image` WHERE imgname = '" + image_name + "'";

    await req.db.query(imgnameQuery, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        if (result.length > 0) {
            message = 'Image with that image name already exists';
            res.render('add-image.ejs', {
                message,
                title: "Welcome to Shopify Intern Challenge | Add Images"
            });
        } else {
            // upload the file to the /public/assets/images dir
            uploadedFile.mv(`public/assets/images/${image_name}`, (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                let query = "INSERT INTO `image` (imgname, imgtype, imgtag) VALUES ('" + image_name + "', '" + fileExtension + "', '" + tags + "')";
                req.db.query(query, (err, result) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                });
            });
        }
    });
}
