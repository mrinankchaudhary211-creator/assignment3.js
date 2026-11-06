
const Product = require("../models/Product");

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// GET ALL PRODUCTS WITH FILTERING, SORTING & PAGINATION
exports.getProducts = async (req, res) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            search,
            sortBy = "createdAt",
            order = "desc",
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (category) filter.category = category;

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        const allowedSortFields = [
            "name", "price", "stock", "createdAt"
        ];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy : "createdAt";

        const sortOrder = order === "asc" ? 1 : -1;

        const pageNumber = Math.max(1, Number(page) || 1);
        const pageLimit = Math.min(100, Math.max(1, Number(limit) || 10));

        const products = await Product.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit);

        const totalProducts = await Product.countDocuments(filter);

        res.json({
            success: true,
            totalProducts,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProducts / pageLimit),
            data: products
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET SINGLE PRODUCT
exports.getProductById = async (req, res) => {
    try {
        if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            data: product
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE PRODUCT DETAILS
exports.updateProduct = async (req, res) => {
    try {
        const allowedFields = [
            "name", "description", "price",
            "category", "lowStockThreshold"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid update fields provided"
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product updated successfully",
            data: product
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// STOCK ADJUSTMENT
exports.adjustStock = async (req, res) => {
    try {
        const adjustment = Number(req.body.adjustment);

        if (!Number.isInteger(adjustment) || adjustment === 0) {
            return res.status(400).json({
                message: "Adjustment must be a non-zero integer"
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        if (product.stock + adjustment < 0) {
            return res.status(400).json({
                message: "Stock cannot become negative"
            });
        }

        product.stock += adjustment;
        await product.save();

        res.json({
            success: true,
            message: "Stock adjusted successfully",
            data: product
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// LOW STOCK ALERT REPORT
exports.lowStockReport = async (req, res) => {
    try {
        const products = await Product.find({
            $expr: {
                $lte: ["$stock", "$lowStockThreshold"]
            }
        });

        res.json({
            success: true,
            totalLowStockProducts: products.length,
            data: products
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CATEGORY-WISE INVENTORY SUMMARY
exports.categorySummary = async (req, res) => {
    try {
        const summary = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalProducts: { $sum: 1 },
                    totalStock: { $sum: "$stock" },
                    totalInventoryValue: {
                        $sum: { $multiply: ["$price", "$stock"] }
                    },
                    averagePrice: { $avg: "$price" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
