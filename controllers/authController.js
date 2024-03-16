const User = require('../models/user.model');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const transporter = require("../utils/nodemailer");
require('dotenv').config();

const handleLogin = async (req, res) => {
    const cookies = req.cookies;
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ 'message': 'Veuillez remplir tout les champs' });

    const foundUser = await User.findOne({username: username}).exec();
    if(foundUser === null) return res.status(401).json({message: 'Password or username incorect'}); //Unauthorized

    // evaluate password
    const match = bcrypt.compare(password, foundUser.password).then( async (result) => {
        if (result) {
            if(!foundUser.email_verified){
                return res.status(400).send({message : "Veuillez vérifier vos mails."});
            }
            const roles = Object.values(foundUser.roles).filter(Boolean);

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": foundUser.username,
                        "roles": roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '10s'}
            );
            const newRefreshToken = jwt.sign(
                { "username": foundUser.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d'}
            );

            // Changed to let keyword
            let newRefreshTokenArray =
                !cookies?.jwt ? foundUser.refreshToken
                    : foundUser.refreshToken.filter(rt => rt !== cookies.jwt);

            if (cookies?.jwt) {
                /*
                Scenario added here:
                    1) User logs in but never uses RT and does not logout
                    2) RT is stolen
                    3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
                */
                const refreshToken = cookies.jwt;
                const foundToken = await User.findOne({ refreshToken }).exec();

                // Detected refresh token reuse!
                if (!foundToken) {
                    console.log('attempted refresh token reuse at login!')
                    // clear out ALL previous refresh tokens
                    newRefreshTokenArray = [];
                }

                res.clearCookie('jwt', { httpOnly: true, secure: true });
            }
            // Saving refreshToken with current user
            foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
            const result = await foundUser.save();
            res.cookie('jwt', newRefreshToken, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 });
            return res.status(200).json({ accessToken });
        } else {
            return res.status(401).json({message: 'Mot de passe ou le nom d\'utilisateur incorrect'});
        }
    }).catch((err) => {
        console.log(err);
        return res.status(400).json({message: 'Erreur lors de la connexion.'});
    });

}

const handleNewUser = async (req, res) => {
    const body = req.body;
    if(body === undefined) return res.status(400).send({message : "Veuillez remplir tout les champs."});

    if (!body.firstname || !body.lastname || !body.username || !body.email || !body.password || !body.confirmPassword || !body.city || !body.address) {
        return res.status(400   ).send({message : "Veuillez remplir tout les champs."});
    }
    let duplicated = await User.findOne({ username: body.username }).exec();
    if (duplicated !== null) {
        return res.status(409).send({message : "Le nom d'utilisateur est déjà utilisé."});
    }

    const user = await User.findOne({ email: body.email }).exec();
    if (user !== null) {
        return res.status(400).send({message : "L'adresse email est déjà utilisée."});
    }

    if(body.password.length < 8){
        return res.status(400).send({message : "Le mot de passe doit contenir au moins 8 caractères."});
    }

    if(body.password !== body.confirmPassword){
        return res.status(400).send({message : "Les mots de passe ne correspondent pas."});
    }
    try {
        const salt = await bcrypt.genSalt(10);
        body.password = await bcrypt.hash(body.password, salt);
        const token = crypto.randomBytes(32).toString('hex');
        const expire_token = new Date();
        expire_token.setHours(expire_token.getHours() + 3);  // Le token expire dans 1 heure
        const result = await User.create({
            firstname: body.firstname,
            lastname : body.lastname,
            lastname : body.lastname,
            username : body.username,
            email : body.email,
            password : body.password,
            confirmPassword : body.confirmPassword,
            address : body.address,
            city : body.city,
            verification_token: token,
            expire_token: expire_token
        });

        const mailOptions = {
            from: `${process.env.MAIL_SENDER}`,
            to: `${body.email}`,
            subject: 'Vérification de votre adresse email',
            html: `<p>Bonjour ${body.firstname},</p>
        <p>Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email.</p>
        <a href="http://localhost:3500/api/user/verify?token=${token}">Vérifier mon adresse email</a>
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
            }
        });
        return res.status(200).send({message : "L'utilisateur a bien été créé."});
    } catch (error) {
        console.log(error);
        return res.status(400).send({message : "Une erreur est survenue lors de la création de l'utilisateur."});
    }
}

const handleLogout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); //No content
    const refreshToken = cookies.jwt;
    // Is refreshToken in db?
    const foundUser = await User.findOne({ refreshToken: refreshToken }).exec();
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, secure: true });
        return res.sendStatus(204);
    }

    // Delete refreshToken in db
    foundUser.refreshToken = foundUser.refreshToken.filter(rt => rt !== refreshToken);
    const result = await foundUser.save();
    console.log(result);

    res.clearCookie('jwt', { httpOnly: true, secure: true });
    res.sendStatus(204);
}
module.exports = { handleLogin, handleNewUser, handleLogout };