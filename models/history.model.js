const mongoose = require("mongoose");
const HistorySchema = new mongoose.Schema({
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
    total: {
        type: Number,
        required: true
    },
}, {
    timestamps: true,  // Ajoute les champs createdAt et updatedAt
});

const History = mongoose.model('History', HistorySchema);

module.exports = History;