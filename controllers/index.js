const fs = require('fs');

exports.getHomePage = (req, res) => {
    let query = "SELECT * FROM `image` ORDER BY imgid ASC";

    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            res.redirect('/');
        }
        res.render('index', {
            title: "Welcome to Shopify Intern Challenge - View Images",
            images: result
        });
    });
};