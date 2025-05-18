const fs = require('fs');
const { google } = require('googleapis');

// STEP 1: Decode Base64 credentials from env variable
const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64_V2;
if (!credentialsBase64) {
  console.error("Missing environment variable: GOOGLE_CREDENTIALS_BASE64_V2");
  process.exit(1);
}

const decodedCredentials = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
fs.writeFileSync('credentials.json', decodedCredentials);

// STEP 2: Authenticate with Google Sheets API
async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // STEP 3: Your spreadsheet ID and range
  const spreadsheetId = '1vi-z__fFdVhUZr3PEDjhM83kqhFtbJX0Ejcfu9M8RKo';
  const range = 'Sheet1!A1';

  // STEP 4: Example data to write
  const values = [['Hello from Render at', new Date().toISOString()]];

  // STEP 5: Write data to sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  });

  console.log('Data written successfully.');
}

main().catch(console.error);