//Sample code update to safely access Notion properties
const fetchFilteredItems = async () => {
  const response = await fetch('https://api.notion.com/v1/databases/YOUR_DATABASE_ID/query', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_INTEGRATION_TOKEN',
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  const filteredItems = data.results.filter(item => item.properties.Published?.checkbox === true);

  return filteredItems.map(item => ({
    id: item.id,
    title: item.properties.Name.title[0].text.content,
    image: item.properties.image.files,
    price: item.properties.Price.number // Added price field
  }));
};