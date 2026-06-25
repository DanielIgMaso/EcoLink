const fs = require('fs');

async function testNominatim() {
  const points = JSON.parse(fs.readFileSync('points.json', 'utf8'));
  console.log(`Testando ${points.length} endereços no Nominatim...`);
  
  let failed = [];
  
  for (const p of points) {
    const query = encodeURIComponent(p.endereco + ', Uberaba');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
      const data = await res.json();
      if (!data || data.length === 0) {
        failed.push(p);
      }
    } catch(e) {
      console.error(e);
    }
    await new Promise(r => setTimeout(r, 1100)); // rate limit
  }
  
  console.log(`\nFalharam ${failed.length} pontos:`);
  failed.forEach(f => console.log(`- ${f.nome}: ${f.endereco}`));
}

testNominatim();
