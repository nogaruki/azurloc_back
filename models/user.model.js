const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    email_verified: {
        type: Boolean,
        required: true,
        default: false
    },
    verification_token: {
        type: String,
        default: null
    },
    expire_token: {
        type: Date,
        default: null
    },
    refreshToken: [String],
    roles: {
        User: {
            type: Number,
            default: 2001
        },
        Admin: Number,
    },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    },
}, {
    timestamps: true,  // Ajoute les champs createdAt et updatedAt
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
