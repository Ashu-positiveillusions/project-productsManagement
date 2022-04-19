const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    title: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true }, //add valid number/decimal for validity
    currencyId: { type: String, required: true, default: "INR" }, // s3 link
    currencyFormat: { type: String, required: true, default: "₹" },
    isFreeShipping: { type: Boolean, default: false },
    productImage: { type: String, required: true },
    style: { type: String, trim: true },
    availableSizes: { type: [String], enum: ["S", "XS", "M", "X", "L", "XXL", "XL"] },// atLeast one size value validation
    installments: { type: Number, required: true, default: 0 },//availability of products
    deletedAt: { type: Date },
    isDeleted: { type: Boolean, default: false }

}, { timestamps: true })

module.exports = mongoose.model("Products", productSchema);