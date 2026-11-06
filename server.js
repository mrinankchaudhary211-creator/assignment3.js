
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(express.json());

// Connect Database
connectDB();

// Home Route
app.get("/", (req, res) => {
    res.send("Inventory Management API is Running");
});

// Product Routes
app.use("/api/products", productRoutes);

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
