const puppeteer = require('puppeteer');
require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');

// Decode base64 credentials from environment
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8')
);

// Environment variables
const TARGET_URL = process.env.TARGET_URL;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_RANGE = process.env.SHEET_RANGE; // e.g., "Sheet15!A2"

async function scrapeAndWrite() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to:', TARGET_URL);
    await page.goto(TARGET_URL, { waitUntil: 'load', timeout: 60000 });

    // Wait for and select dropdowns
    await page.waitForSelector('#ddl_state', { timeout: 30000 });
    await page.select('#ddl_state', '17'); // 17 = Madhya Pradesh

    await page.waitForSelector('#ddl_district', { timeout: 30000 });
    await page.select('#ddl_district', '02'); // Replace with actual district code

    await page.waitForSelector('#ddl_block', { timeout: 30000 });
    await page.select('#ddl_block', '001'); // Replace with actual block code

    await page.waitForSelector('#ddl_panchayat', { timeout: 30000 });
    await page.select('#ddl_panchayat', '0001'); // Replace with actual panchayat code

    // Select radio button (customize the value)
    await page.waitForSelector('input[name="rb_option"]', { timeout: 30000 });
    await page.click('input[name="rb_option"][value="1"]'); // Replace "1" with actual value

    // Submit the form
    await page.click('#btnSubmit');

    // Wait for table to load
    await page.waitForSelector('#musterroll', { timeout: 60000 });

    // Scrape table data
    const tableData = await page.$$eval('#musterroll tbody tr', rows =>
      rows.map(row =>
        Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim())
      )
    );

    console.log(`Extracted ${tableData.length} rows`);

    // Setup Google Sheets
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();

    const sheetTitle = SHEET_RANGE.split('!')[0];
    const sheet = doc.sheetsByTitle[sheetTitle];

    // Add rows to the sheet
    const rowsToAdd = tableData.map(row => {
      const rowObject = {};
      row.forEach((cell, index) => {
        rowObject[`column${index + 1}`] = cell;
      });
      return rowObject;
    });

    await sheet.addRows(rowsToAdd);
    console.log('✅ Data written to Google Sheets');

    await browser.close();
  } catch (error) {
    console.error('❌ Error during scraping or writing data:', error);
  }
}

scrapeAndWrite();
