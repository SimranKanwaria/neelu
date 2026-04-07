const fs = require("fs");
const path = require("path");
const https = require("https");

// ENV VARIABLES
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.DATABASE_ID;

// Create images folder safely
const imagesDir = path.join(__dirname, "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Download image helper
const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    if (!url) return resolve(null);

    const file = fs.createWriteStream(filepath);

    https.get(url, response => {
      if (response.statusCode !== 200) {
        return reject(`Failed to get '${url}' (${response.statusCode})`);
      }

      response.pipe(file);

      file.on("finish", () => {
        file.close(() => resolve(filepath));
      });

    }).on("error", err => {
      fs.unlink(filepath, () => reject(err.message));
    });
  });
};

// Main function
async function fetchData() {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    const formatted = [];

    for (let i = 0; i < data.results.length; i++) {
      const item = data.results[i];

      // Only published items
      if (!item.properties?.Published?.checkbox) continue;

      const title = item.properties?.Name?.title?.[0]?.plain_text || "Untitled";
      const description = item.properties?.Description?.rich_text?.[0]?.plain_text || "";
      const price = item.properties?.Price?.number || 0;

      // Handle BOTH Notion file & external images
      const imageUrl =
        item.properties?.image?.files?.[0]?.file?.url ||
        item.properties?.image?.files?.[0]?.external?.url ||
        null;

      let localImagePath = "";

      if (imageUrl) {
        try {
          const fileName = `art-${i}.jpg`;
          const fullPath = path.join(imagesDir, fileName);

          console.log("Downloading:", imageUrl);

          await downloadImage(imageUrl, fullPath);

          // Save relative path for website
          localImagePath = `images/${fileName}`;

        } catch (err) {
          console.error("Image download failed:", err);
        }
      }

      formatted.push({
        title,
        description,
        image: localImagePath,
        price
      });
    }

    // Write data.json
    fs.writeFileSync("data.json", JSON.stringify(formatted, null, 2));

    console.log(`✅ Done! Saved ${formatted.length} items`);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run script
fetchData();
