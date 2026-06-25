const fs = require('fs');

const kml = fs.readFileSync('points.kml', 'utf8');
const points = [];

// Split by folder
const folders = kml.split('<Folder>');
folders.shift(); // remove everything before first folder

for (const folder of folders) {
  const folderNameMatch = /<name>(.*?)<\/name>/.exec(folder);
  const categoryStr = folderNameMatch ? folderNameMatch[1].trim() : '';
  
  let catId = 'ecoponto';
  if (categoryStr.includes('Óleo')) catId = 'oleo';
  if (categoryStr.includes('Reversa')) catId = 'reversa';
  
  const regex = /<Placemark>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<address>(.*?)<\/address>[\s\S]*?<\/Placemark>/g;
  let match;
  while ((match = regex.exec(folder)) !== null) {
    points.push({
      nome: match[1].trim(),
      endereco: match[2].trim(),
      categorias: [catId]
    });
  }
}

fs.writeFileSync('points.json', JSON.stringify(points, null, 2));
console.log(`Extracted ${points.length} points with categories.`);
