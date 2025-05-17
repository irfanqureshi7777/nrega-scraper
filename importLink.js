require("dotenv").config();
const { google } = require("googleapis");
const axios = require("axios");
const cheerio = require("cheerio");

const SPREADSHEET_ID = "1bsS9b0FDjzPghhAfMW0YRsTdNnKdN6QMC6TS8vxlsJg";
const SHEET_NAME = "Sheet2";

const URL_CELL = `${SHEET_NAME}!B2`;
const OUTPUT_START_CELL = `${SHEET_NAME}!B6`;
const AXIOS_TIMEOUT = 10_000; // 10 seconds

// Authorize Google Sheets API client
async function authorize() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, "base64").toString("utf-8")
  );

  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

// Fetch URL from a specific sheet cell
async function getUrlFromSheet(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: URL_CELL,
  });
  return res.data.values?.[0]?.[0];
}

// Validate and normalize hyperlink
function isValidLink(href) {
  if (!href) return false;
  href = href.trim();

  // Exclude fragment-only links (#...)
  if (href.startsWith("#")) return false;

  // Exclude javascript:void(0), mailto:, tel:, empty, etc.
  if (
    href.startsWith("javascript:") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href === ""
  )
    return false;

  return true;
}

// Fetch all valid hyperlinks from page
async function fetchHyperlinks(url) {
  let response;
  try {
    response = await axios.get(url, { timeout: AXIOS_TIMEOUT });
  } catch (err) {
    throw new Error(`Failed to fetch URL: ${err.message}`);
  }

  const $ = cheerio.load(response.data);
  const links = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (isValidLink(href)) {
      links.push([href]);
    }
  });

  return links;
}

// Write links to sheet starting from given range
async function writeLinksToSheet(sheets, links) {
  if (links.length === 0) {
    console.log("No valid links found to write.");
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: OUTPUT_START_CELL,
    valueInputOption: "RAW",
    resource: { values: links },
  });
}

// Main execution
(async () => {
  try {
    const sheets = await authorize();

    const url = await getUrlFromSheet(sheets);
    if (!url) throw new Error(`URL not found in cell ${URL_CELL}`);

    console.log(`Fetching hyperlinks from: ${url}`);

    const links = await fetchHyperlinks(url);
    console.log(`Found ${links.length} total hyperlinks, writing valid ones...`);

    await writeLinksToSheet(sheets, links);

    console.log(`✅ Imported ${links.length} hyperlinks to ${OUTPUT_START_CELL}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
