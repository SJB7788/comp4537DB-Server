const { log } = require("console");
const http = require("http");
const url = require("url");

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const parsedURL = url.parse(req.url, true);
  const path = parsedURL.pathname;

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    res.writeHead(204); // No Content
    res.end();
    return; 
  }

  if (path == "/insert" && req.method == "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      console.log("Raw Body:", body);
      const reqBody = JSON.parse(body);
      // do db stuff here
      res.end(JSON.stringify(reqBody)); // add new data here
    });
    // do db suff here
  } else if (path == "/query") {
    if (req.method == "POST") {
      let body = "";
      req.on("data", (chunk) => {body += chunk});
      req.on("end", () => {
        const stringBody = JSON.parse(body);
        const reqBody = JSON.parse(reqBody);
        const reqString = reqBody.query;
        
        // do db query with json
        res.end(JSON.stringify(reqBody)); // add new data here
      });
    } else if (req.method == "GET") {
      const query = parsedURL.query;
      const sqlQueryString = query.query;
      // add db stuff here
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ query: sqlQueryString })); // add data here
    }
  }
});

server.listen(8000, () => {
  console.log("Listening on port 8000");
});
