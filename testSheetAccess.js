const { google } = require('googleapis');
const path = require('path');

// Path to your service account credentials file
const credentialsPath = path.join(__dirname, 'credentials.json');
const spreadsheetId = '1vi-z__fFdVhUZr3PEDjhM83kqhFtbJX0Ejcfu9M8RKo';  // Replace with your actual spreadsheet ID

// Initialize the Google Sheets API client
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  return sheets;
}

// Read or write data to the sheet
async function readSheet() {
  const sheets = await authenticate();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: 'Sheet1!A1:B10',  // Adjust the range as needed
  });

  console.log('Data from the sheet:');
  console.log(res.data.values);
}

async function writeSheet() {
  const sheets = await authenticate();

  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: 'Sheet1!A1', // Adjust the range as needed
    valueInputOption: 'RAW',
    resource: {
      values: [
        ['Hello', 'World'],  // Example data to insert into A1:B1
      ],
    },
  });

  console.log('Data written successfully');
}

readSheet();  // Or use writeSheet() to write data instead
