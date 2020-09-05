# Shopify Intern Challenge (Backend) Winter 2021 - Image Repository

Image Repository is simple, functional platform for managing images.

## Installation
Use the package manager npm to install
```
npm install
```

## Usage, Features and Implementation Ideas

### Usage
Local development use is not recommended, will need Google Cloud integrations.
Image Repository is deployed on Google Cloud App Engine, accessible through http://shopifyinternchallenge.appspot.com/.  

### Features and Implementation Ideas

1. ADD image(s) to the repository
    - Supports single/bulk upload of images
    - All uploaded images are stored securely on Google Cloud Storage server
2. SEARCH images
    - Supports 3 types of searching: search by characteristics of the images, search by recognized texts on the image, search by image (search for similar images)
    - Search function is supported by Google Vision and fuse.js, each time an image is uploaded to the server, tags will
    be added to the image based on results from Google Vision API. Similarly, Google Vision is used for OCR purposes and
    recognizes texts from the image. Fuse.js is mainly used for fuzzy search purposes.
3. DELETE image
    - Supports single image deletion

Image Repository uses node.js environment and is fully developed on/for Google Cloud Platform. Backend/Database is supported
by Google Cloud MySQL, persistent storage is supported by Google Cloud Storage and deployment is supported by Google App Engine.

### Future Improvements

1. Front End improvements
    - Add loading indications and create a more intuitive and robust interface
2. Feature improvements
    - Add elasticsearch for improved search results
    - Add full SSL support for more secure transactions

