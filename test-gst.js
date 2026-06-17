const https = require('https');

function testAPI(url, headers = {}) {
  return new Promise((resolve) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ url, status: res.statusCode, data: data.substring(0, 200) });
      });
    }).on('error', (err) => resolve({ url, error: err.message }));
  });
}

async function run() {
  const gstin = '27AAAAA0000A1Z5'; // Sample format
  const urls = [
    'https://appyflow.in/api/verifyGST?gstNo=' + gstin,
    'https://api.gstincheck.co.in/v1/verify?gstin=' + gstin,
    'https://api.clear.in/gst/v1/public/search?gstin=' + gstin
  ];

  for (const url of urls) {
    console.log(await testAPI(url, { 'User-Agent': 'Mozilla/5.0' }));
  }
}

run();
