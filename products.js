
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    category: {
        type: String,
        required: true,
        trim: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    quantity: {
        type: Number,
        required: true,
        min: 0
    },

    reorderLevel: {
        type: Number,
        default: 5,
        min: 0
    },

    supplier: {
        type: String,
        required: true
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Calculate stock value automatically
productSchema.virtual("stockValue").get(function () {
    return this.price * this.quantity;
});

module.exports = mongoose.model("Product", productSchema);

