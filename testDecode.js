const fs = require("fs");

function testDecode(filename) {
  try {
    const base64 = fs.readFileSync(filename, "utf-8").trim();
    const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    const json = JSON.parse(jsonStr);
    console.log(`✅ ${filename} decoded successfully!`);
    console.log(json.project_id);  // Just a quick check for a valid key
  } catch (err) {
    console.error(`❌ Failed to decode ${filename}:`, err.message);
  }
}

testDecode("encoded.txt");
testDecode("encoded-key.txt"); 
