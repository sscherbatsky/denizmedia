import fetch from 'node-fetch';

// Usage: node scripts/teach-multiplication.mjs [max]
// Example: node scripts/teach-multiplication.mjs 10

const max = parseInt(process.argv[2] || '10', 10);
const url = process.env.BOT_URL || 'http://localhost:3000/api/bot/message';

async function teach(pairText) {
  const body = { text: `öğret ${pairText}` };
  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
    const j = await res.json();
    console.log('Taught:', pairText, '→', j.reply || JSON.stringify(j));
  } catch (e) {
    console.error('Error teaching', pairText, e.message || e);
  }
}

(async () => {
  for (let i = 1; i <= max; i++) {
    for (let j = 1; j <= max; j++) {
      const text = `${i}*${j} = ${i * j}`;
      await teach(text);
      await new Promise(r => setTimeout(r, 120));
    }
  }
  console.log('Done teaching multiplication table up to', max);
})();
