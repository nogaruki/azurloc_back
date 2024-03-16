const mongoose = require("mongoose");
const CartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    activities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Activity',
        required: true
    }],
}, {
    timestamps: true,  // Ajoute les champs createdAt et updatedAt
});

const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart;