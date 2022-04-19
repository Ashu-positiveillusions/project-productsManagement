const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({

    userId: { type: ObjectId, ref: "Users", required: true, unique: true },
    items: [{
                _id: false,
                productId: { type: ObjectId, ref: "Products", required: true },
                quantity: { type: Number, required: true, minimum: 1 }
            }],
    totalPrice: { type: Number, required: true, default: 0, comment: "Holds total price of all the items in the cart" },
    totalItems: { type: Number, required: true, default: 0, comment: "Holds total number of items in the cart" }
}, { timestamps: true })

module.exports = mongoose.model("Carts", cartSchema);