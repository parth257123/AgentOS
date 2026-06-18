const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173/dashboard/studio', { waitUntil: 'networkidle0', timeout: 5000 }).catch(e => console.log('Timeout'));
  
  await browser.close();
})();
