const https = require("https");

const projectId = "clin-a278c"; // ← підстав свій projectId
const region = "us-central1";
const functionName = "getVideoSDKToken";

const data = JSON.stringify({ data: {} });

const options = {
  hostname: `${region}-${projectId}.cloudfunctions.net`,
  port: 443,
  path: `/${functionName}`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = https.request(options, (res) => {
  let responseBody = "";

  res.on("data", (chunk) => {
    responseBody += chunk;
  });

  res.on("end", () => {
    console.log("Response:");
    console.log(responseBody);
  });
});

req.on("error", (error) => {
  console.error("Error:", error);
});

req.write(data);
req.end();
