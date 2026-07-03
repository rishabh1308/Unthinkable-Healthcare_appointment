require('dotenv').config();

const { google } = require('googleapis');

console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
console.log('REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function getToken() {
  const code = '4/0AdkVLPzbk647D35pPNTAb6UbQOqNyQwtuaOgNf9xUIrKUI1gfDIulZR_nw6-b1l6aX4tHA';

  const { tokens } = await oauth2Client.getToken(code);

  console.log('\nTokens:\n');
  console.log(tokens);
}

getToken().catch(console.error);