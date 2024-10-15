const http = require('http');
const mysql = require('mysql2');
require('dotenv').config("./.env"); // Load environment variables
const fs = require('fs'); // Include the fs module

console.log(process.env.DB_HOST);


// Create a connection to the MySQL database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ', err);
        return;
    }
    console.log('Connected to the database');
});

// Create the server
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'POST' && req.url === '/insert') {
        let body = '';

        // Collect data from the request
        req.on('data', chunk => {
            body += chunk.toString(); // Convert Buffer to string
        });

        req.on('end', () => {
            const patientData = JSON.parse(body);
            const insertQuery = `
                INSERT INTO patient (first_name, last_name, dob, address, phone_number, email)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            // Execute the INSERT query
            connection.query(insertQuery, [patientData.first_name, patientData.last_name, patientData.dob, patientData.address, patientData.phone_number, patientData.email], (err, results) => {
                if (err) {
                    console.error('Error inserting data: ', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Error inserting data' }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Patient data inserted successfully', id: results.insertId }));
            });
        });
    } else if (req.method === 'GET' && req.url === '/patients') {
        const selectQuery = 'SELECT * FROM patient';

        // Execute the SELECT query
        connection.query(selectQuery, (err, results) => {
            if (err) {
                console.error('Error fetching data: ', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error fetching data' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results)); // Send the results as JSON
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Endpoint not found' }));
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});