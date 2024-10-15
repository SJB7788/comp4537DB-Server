const http = require("http");
const mysql = require("mysql2");
require("dotenv").config("./.env"); // Load environment variables
const fs = require("fs"); // Include the fs module
const url = require("url");

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: ", err);
    return;
  }
  console.log("Connected to the database");
});

// Create the server
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTION");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const parsedURL = url.parse(req.url, true);
  const path = parsedURL.pathname;

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/insert") {
    let body = "";

    // Collect data from the request
    req.on("data", (chunk) => {
      body += chunk.toString(); // Convert Buffer to string
    });

    req.on("end", () => {
      console.log(body);
      
      const patientData = JSON.parse(body);
      const patientList = patientData.patients;
      patientList.forEach((patient) => {
        const insertQuery = `
        INSERT INTO patient (first_name, last_name, dob, address, phone_number, email)
        VALUES (?, ?, ?, ?, ?, ?)
    `;  
        // Execute the INSERT query
        try {
          connection.query(
            insertQuery,
            [
              patient.first_name,
              patient.last_name,
              patient.dob,
              patient.address,
              patient.phone_number,
              patient.email,
            ],
            (err, results) => {
              if (err) {
                console.error("Error inserting data: ", err);
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 400;
                res.end(
                  JSON.stringify({
                    message: "Error inserting data",
                    sqlErrorMessage: err,
                  })
                );
                return;
              }
            }
          );
        } catch (error) {
          console.error("Error: ", error);
        }
      });
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          message: "Patient data inserted successfully",
        })
      );
    });
  } else if (req.method === "GET" && path === "/query") {
    const queryURL = parsedURL.query;
    const sqlQueryString = queryURL.query;

    // Execute the SELECT query
    connection.query(sqlQueryString, (err, results) => {
      if (err) {
        console.error("Error fetching data: ", err);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            message: "Error fetching data",
            receivedData: queryURL,
            sqlErrMessage: err,
          })
        );
        return;
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(results)); // Send the results as JSON
    });
  } else if (req.method === "POST" && path === "/query") {
    let body = "";

    // Collect data from the request
    req.on("data", (chunk) => {
      body += chunk.toString(); // Convert Buffer to string
    });

    req.on("end", () => {
      const queryJson = JSON.parse(body);
      if (queryJson.query) {
        const sqlQuery = queryJson.query;
        connection.query(sqlQuery, (err, results) => {
          if (err) {
            console.error("Error inserting data: ", err);
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                message: "Error inserting data",
                receivedData: sqlQuery,
                sqlErrMessage: err,
              })
            );
            return;
          }
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify(results)); // Send the results as JSON
        });
      } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 422;
        res.end(
          JSON.stringify({ error_message: 'Data must contain "Query" key' })
        );
      }
    });
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Endpoint not found", url: req.url }));
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
