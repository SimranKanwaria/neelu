const fs = require("fs");
const path = require("path");
const https = require("https");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.DATABASE_ID;

const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, response => {
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", err => {
      fs.unlink(filename, () => reject(err));
    });
  });
};

async function fetchData() {
  const res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();

  if (!fs.existsSync("images")) {
    fs.mkdirSync("images");
  }

  const formatted = [];

  for (let i = 0; i < data.results.length; i++) {
    const item = data.results[i];

    if (!item.properties.Published?.checkbox) continue;

    const title = item.properties.Name.title[0]?.plain_text || "";
    const description = item.properties.Description.rich_text[0]?.plain_text || "";
    const price = item.properties.Price?.number || 0;

    const imageUrl =
      item.properties.image?.files[0]?.file?.url ||
      item.properties.image?.files[0]?.external?.url;

    let localImage = "";

    if (imageUrl) {
      const filename = `images/art-${i}.jpg`;
      await downloadImage(imageUrl, filename);
      localImage = filename;
    }

    formatted.push({
      title,
      description,
      image: localImage,
      price
    });
  }

  fs.writeFileSync("data.json", JSON.stringify(formatted, null, 2));
  console.log(`Fetched ${formatted.length} items with images`);
}

fetchData().catch(err => console.error(err));
