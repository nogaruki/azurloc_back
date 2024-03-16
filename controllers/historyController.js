const history = require('../models/history.model');
const User = require('../models/user.model');


async function getHistory(req, res) {
    const username = req.username;
    User.findOne({ username: username }, async function (err, user) {
        if (err) {
            return res.status(500).send({ message: "Error while getting user" });
        }
        if (user === null) {
            return res.status(400).send({ message: "User not found." });
        }
        const historyList = await history.find({ username: username }).exec();
        if (historyList === null) {
            return res.status(400).send({ message: "History not found." });
        }
        res.status(200).send(historyList);
    });
}

async function addHistory(req, res) {
    const username = req.username;
    try {
        const user = await User.findOne({ username: username }).populate('cart');
        if (!user) {
            return res.status(400).send({ message: "User not found." });
        }

        // Supposant que vous avez déjà validé et préparé les données d'historique à sauvegarder
        const newHistory = new history({
            user: user._id,
            cart: user.cart._id, // Utiliser le panier directement depuis l'utilisateur
            buyingDate: new Date(),
        });
        await newHistory.save();

        // Supprimer le panier après avoir ajouté l'entrée dans l'historique
        await Cart.findByIdAndRemove(user.cart._id);

        // Il est également important de nettoyer la référence du panier dans l'utilisateur
        user.cart = null;
        await user.save();

        res.status(200).send({ message: "History saved and cart cleared" });
    } catch (error) {
        res.status(500).send({ message: "Error while processing history", error: error.message });
    }
}



async function getHistoryByYear(req, res) {
    const username = req.username;
    const year = parseInt(req.params.year); // Assurez-vous que l'année est passée en tant que paramètre dans l'URL

    if (!year) {
        return res.status(400).send({ message: "Year is required as a parameter." });
    }

    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(400).send({ message: "User not found." });
        }

        // Créer les dates de début et de fin de l'année pour le filtrage
        const startDate = new Date(year, 0, 1); // 1er janvier de l'année
        const endDate = new Date(year + 1, 0, 1); // 1er janvier de l'année suivante

        const historyList = await History.find({
            user: user._id,
            buyingDate: { $gte: startDate, $lt: endDate }
        }).exec();

        if (!historyList.length) {
            return res.status(404).send({ message: "No history found for this year." });
        }

        res.status(200).send(historyList);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error retrieving history by year", error: error.message });
    }
}


module.exports = {
    getHistory,
    addHistory,
    getHistoryByYear
};