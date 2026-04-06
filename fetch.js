const fs = require("fs");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.DATABASE_ID;

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

  const formatted = data.results
    .filter(item => item.properties.Published?.checkbox === true)
    .map(item => ({
      title: item.properties.Name.title[0]?.plain_text || "",
      description: item.properties.Description.rich_text[0]?.plain_text || "",
      image: item.properties.image?.files[0]?.file?.url || "",
      price: item.properties.Price?.number || 0
    }));

  fs.writeFileSync("data.json", JSON.stringify(formatted, null, 2));
  console.log(`Fetched ${formatted.length} published items`);
}

fetchData().catch(err => console.error("Error:", err));
