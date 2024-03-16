const mongoose = require("mongoose");
const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    activities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    }],
}, {
    timestamps: true,  // Ajoute les champs createdAt et updatedAt
});

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;