const crypto = require("crypto");
// https://qiita.com/_daisuke/items/990513e89ca169e9c4ad
// https://dev.to/shamsup/creating-the-secret-hash-for-aws-cognito-in-nodejs-50f7
const [exe, filename, username, app_client_id, key] = process.argv;
const output = crypto
  .createHmac("sha256", key)
  .update(`${username}${app_client_id}`)
  .digest("base64");

console.log(output);
