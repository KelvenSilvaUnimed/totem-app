const { request } = require('undici');

async function test() {
  const url = 'https://n-storage-to-printer.unimedpatos.sgusuite.com.br/document/222f9b6a-c90e-4a58-af1e-4c0b0e12a598';
  console.log('Fetching:', url);
  try {
    const { statusCode, headers, body } = await request(url);
    console.log('Status:', statusCode);
    console.log('Headers:', headers);
    if (statusCode !== 200) {
      console.log('Body text:', await body.text());
    } else {
      console.log('Success! Got body.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
