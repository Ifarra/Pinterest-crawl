const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const process = require("process");

// The base URL for Pinterest search
const baseUrl = "https://id.pinterest.com/search/pins/?q=";

// Get the search query and number of images to download from the command line
const query = process.argv[2];
const numImages = parseInt(process.argv[3]);

// Construct the URL for the search query
const url = baseUrl + encodeURIComponent(query);

axios
  .get(url)
  .then((response) => {
    const html = response.data;
    const $ = cheerio.load(html);

    // Select all the pins on the page
    const pins = $(".Pin");

    // Loop through each pin and download its image
    let imagesDownloaded = 0;
    pins.each((index, pin) => {
      if (imagesDownloaded >= numImages) {
        return;
      }
      const pinUrl = $(pin).find(".PinInner a").attr("href");
      axios
        .get(pinUrl)
        .then((response) => {
          const html = response.data;
          const $ = cheerio.load(html);
          const imageUrl = $(".PinImage > img").attr("src");
          const imageName = path.basename(imageUrl);
          const imagePath = path.join(__dirname, "images", imageName);

          axios({
            url: imageUrl,
            method: "GET",
            responseType: "stream",
          })
            .then((response) => {
              response.data.pipe(fs.createWriteStream(imagePath));
              console.log(`Downloaded image ${imageName}`);
              imagesDownloaded++;
              if (imagesDownloaded >= numImages) {
                console.log(`Downloaded ${numImages} images`);
              }
            })
            .catch((error) => {
              console.error(`Error downloading image: ${error.message}`);
            });
        })
        .catch((error) => {
          console.error(`Error fetching pin: ${error.message}`);
        });
    });
  })
  .catch((error) => {
    console.error(error);
  });
