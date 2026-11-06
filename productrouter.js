
const express = require("express");
const router = express.Router();

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    adjustStock,
    deleteProduct,
    lowStockReport,
    categorySummary
} = require("../controllers/productController");

// Reports
router.get("/reports/low-stock", lowStockReport);
router.get("/reports/category-summary", categorySummary);

// Product APIs
router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.patch("/:id/stock", adjustStock);
router.delete("/:id", deleteProduct);

module.exports = router;
