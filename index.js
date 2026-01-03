
const express = require("express");
const app = express();
const PORT = 3000;
const route = require("./route");
const path = require("path");

// Middleware
app.use(express.json());
// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api/fileanalysis", route);

// Default route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Sample API route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Node.js!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});