const User = require("../models/user.model");
const Cart = require("../models/cart.model");
const Activity = require("../models/activity.model");
const History = require("../models/history.model");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const transporter = require('../utils/nodemailer');
require('dotenv').config();


async function edit(req, res) {

    let body = req.body
     if (!body.firstname || !body.lastname || !body.city || !body.address) {
         return res.status(400).send({message : "At least one input must be filled"});
     
     }
    const user = await User.findOne( {username: req.username }).exec();
    if (user === null) {
        return res.status(400).send({message : "User not found."});
    }

    // Si l'utilisateur veut changer son email
    if(body.newEmail) {
        if(body.newEmail !== body.confirmEmail){
            return res.status(400).send({message : "The emails do not match."});
        }
        user.email = body.newEmail;
    }
    
    // Si l'utilisateur veut changer son mot de passe
    if(body.newPassword) {
        if(body.newPassword !== body.confirmPassword){
            return res.status(400).send({message : "The passwords do not match."});
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(body.newPassword, salt);
    }

    // Si l'utilisateur veut changer son nom
    if(body.firstname) {
        user.firstname = body.firstname;

    }

    // Si l'utilisateur veut changer son prénom
    if(body.lastname) {
        user.lastname = body.lastname;
    }

    // Si l'utilisateur veut changer sa ville
    if(body.city) {
        user.city = body.city;
    }
    if(body.address) {
        user.address = body.address;
    }

    await user.save();
    return res.status(200).send({message : "L'utilisateur a bien été modifié."});
}

async function getById(req, res) {
    return User.findOne({_id: req.userId}).exec();
}

async function getInfo(req, res) {
    let username = req.username;
    let foundedUser = await User.findOne({ username: username });
    if (!foundedUser) {
        return res.status(400).json({ "message": `Utilisateur non trouvé` });
    }

    return res.status(200).json({ "user": foundedUser });
}

async function emailVerification(req, res) {
    const token = req.query.token;
    if (!token) {
        return res.status(400).send({message: "Pas de token fourni dans la requête."});
    }
    let foundedUser = await User.findOne({verification_token: token}).exec();
    if (foundedUser === null) {
        return res.status(403).send({message: "Token invalide."});
    }
    const now = new Date();
    if (now > foundedUser.expire_token) {
        return res.status(400).send({message: "Token expiré."});
    }
    foundedUser.email_verified = true;
    foundedUser.verification_token = null;
    foundedUser.expire_token = null;
    foundedUser.save();

    return res.status(200).send({message: "Votre adresse email a bien été vérifiée."});
}

function resetPassword(req, res) {
    try {
        const {email} = req.body;
        User.findOne({ email: email }).exec().then(user => {
            if(user === null){
                return res.status(400).send({message : "User not found."});
            }
            const token = crypto.randomBytes(32).toString('hex');
            const expire_token = new Date();
            expire_token.setHours(expire_token.getHours() + 3);  // Le token expire dans 1 heure
            user.verification_token = token;
            user.expire_token = expire_token;
            user.save();
            const mailOptions = {
                from: `${process.env.MAIL_SENDER}`,
                to: `${user.email}`,
                subject: 'Réinitialisation de votre mot de passe',
                html: `<p>Bonjour ${user.firstname},</p>
            Veuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe.</p>
            <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Réinitialiser mon mot de passe</a>
            <p>Ce lien expirera dans 3 heures.</p>
            <p>Cordialement,</p>
            <p>L'équipe de Datark</p>`
            };
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                    return res.status(400).send({message : "Une erreur est survenue lors de l'envoi du mail."});
                } else {
                    console.log('Email sent: ' + info.response);
                    return res.status(200).send({message : "Un mail de réinitialisation de mot de passe a été envoyé."});
                }
            });
        });
    } catch (error) {
     console.log(error)
     return res.status(400).send({message : "Une erreur est survenue."});
    }

}

function newPassword(req, res) {
    const token = req.query.token;
    const body = req.body;
    if(!token){
        return res.status(400).send({message : "Pas de token fourni dans la requête."});
    }
    User.findOne({verification_token: token }).exec().then(async  user => {
        if(user === null){
            return res.status(400).send({message : "Token invalide."});
        }
        const now = new Date();
        if(now > user.expire_token){
            return res.status(400).send({message : "Token expiré."});
        }
        if(body.password !== body.confirmPassword){
            return res.status(400).send({message : "Les mots de passe ne correspondent pas."});
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.verification_token = null;
        user.expire_token = null;
        user.save();
        return res.status(200).send({message : "Votre mot de passe a bien été modifié."});
    }).catch(err => {
        return res.status(400).send({message : "Une erreur est survenue."});
    });
}

async function resendEmailVerification(req, res) {
    const user = await User.findOne({username: req.username }).exec();
    if (user === null) {
        return res.status(400).send({message : "Utilisateur introuvable."});
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expire_token = new Date();
    expire_token.setHours(expire_token.getHours() + 3);  // Le token expire dans 1 heure
    await user.update({
        verification_token: token,
        expire_token: expire_token
    });
    const mailOptions = {
        from: `${process.env.MAIL_SENDER}`,
        to: `${user.email}`,
        subject: 'Vérification de votre adresse email',
        html: `<p>Bonjour ${user.firstname},</p>
        <p>Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email.</p>
        <a href="http://localhost:8080/api/user/verify?token=${token}">Vérifier mon adresse email</a>
        <p>Ce lien expirera dans 3 heures.</p>
        <p>Cordialement,</p>
        <p>L'équipe de Datark</p>`
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            return res.status(400).send({message : "Une erreur est survenue lors de l'envoi du mail."});
        } else {
            console.log('Email sent: ' + info.response);
            return res.status(200).send({message : "Un nouveau mail de vérification a été envoyé."});
        }
    });

    return res.status(400).send({message : "Une erreur est survenue lors de l'envoi du mail."});
}

async function deleteUser(req, res) {
    const foundedUser = await User.findOne({ _id: req.body.id}).exec();
    if (!foundedUser) {
        return res.status(400).json({ "message": `Utilisateur non trouvé` });
    }
    try {
        await foundedUser.destroy();
    } catch (error) {
        return res.status(400).json({ "message": `Une erreur est survenue lors de la suppression de l'utilisateur` });
    }
    return res.status(200).json({ "message": `Utilisateur supprimé` });
}

async function getCart(req, res) {
    let username = req.username;
    User.findOne({ username: username }).exec().then(user => {
        if(user === null){
            return res.status(400).send({message : "User not found."});
        }
        Cart.findOne({ _id: user.cart }).populate('activities').exec().then(cart => {
            if(cart === null){
                return res.status(400).send({message : "Cart not found."});
            }
            return res.status(200).send({cart : cart});
        });
    });
}

async function addToCart(req, res) {
    let username = req.username;
    let activityId = req.body.activity;
    User.findOne({username: username}).exec().then(async user => {
        if (user === null) {
            return res.status(400).send({message: "User not found."});
        }
        if (!user.cart) {
            // Créer un nouveau panier si l'utilisateur n'en a pas
            const newCart = new Cart({user: user._id, activities: [activityId]});
            await newCart.save();
            user.cart = newCart._id;
        } else {
            // L'utilisateur a déjà un panier, ajoutez l'activité à ce panier
            const cart = await Cart.findById(user.cart);
            if (!cart.activities.includes(activityId)) {
                cart.activities.push(activityId);
                await cart.save();
            }
        }
        await user.save();
        return res.status(200).send({message: "Activity added to cart."});
    });
}

async function removeFromCart(req, res) {
    let username = req.username;
    let activityId = req.body.activity
    User.findOne({username: username}).exec().then(user => {
        if (user === null) {
            return res.status(400).send({message: "User not found."});
        }
        Cart.findOne({ _id: user.cart }).exec().then(cart => {
            if (cart === null) {
                return res.status(400).send({message: "Cart not found."});
            }
            const index = cart.activities.indexOf(activityId)
            if (index > -1) {
                // Si l'activité est trouvée dans le tableau, la supprimer
                cart.activities.splice(index, 1);

                // Sauvegarder le panier mis à jour
                cart.save()
                    .then(() => res.status(200).send({message: "Activity removed from cart."}))
                    .catch(error => res.status(500).send({message: "Error updating cart.", error}));
            } else {
                // Si l'activité n'est pas trouvée dans le tableau
                return res.status(404).send({message: "Activity not found in cart."});
            }

        });

    });
}

async function addHistory(req, res) {
    const username = req.username;
    try {
        const user = await User.findOne({ username: username }).populate('cart');
        if (!user) {
            return res.status(400).send({ message: "User not found." });
        }
        const activityList = await Activity.find({ _id: { $in: user.cart.activities } }).exec();
        const total = activityList.reduce((acc, activity) => acc + activity.price, 0);
        const newHistory = new History({
            user: user._id,
            activities: activityList.map(activity => activity._id),
            total: total
        });
        await newHistory.save();

        // Supprimer le panier après avoir ajouté l'entrée dans l'historique
        user.cart = null;
        await user.save();

        res.status(200).send({ message: "History saved and cart cleared" });
    } catch (error) {
        res.status(500).send({ message: "Error while processing history", error: error.message });
    }
}

async function getHistory(req, res) {
    const username = req.username;

    try {
        // Trouver l'utilisateur par son nom d'utilisateur
        const user = await User.findOne({ username: username }).exec();

        if (!user) {
            return res.status(400).send({ message: "User not found." });
        }
        console.log(user._id);
        // Trouver l'historique de l'utilisateur par son ID
        const historyList = await History.find({ user: user._id }).populate('activities');
        if (historyList.length === 0) {
            return res.status(200).send([]);
        }

        res.status(200).send(historyList);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error while getting user history" });
    }
}


module.exports = { edit, emailVerification, resendEmailVerification, getHistory, resetPassword, addHistory, newPassword, deleteUser, getInfo, getCart, addToCart, removeFromCart };