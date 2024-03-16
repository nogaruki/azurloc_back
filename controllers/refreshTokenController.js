const User = require('../models/user.model');

const jwt = require('jsonwebtoken');
require('dotenv').config();

const handleRefreshToken = async (req, res) => {
    const { jwt: refreshToken } = req.cookies;
    if (!refreshToken) return res.sendStatus(401);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err || !decoded?.username) {
            console.log('Invalid or expired refresh token:', err?.message);
            return res.sendStatus(403); // Forbidden
        }
        const foundUser = await User.findOne({ username: decoded.username, refreshToken: { $in: [refreshToken] } });
        if (!foundUser) {
            console.log('No matching user found for the provided refresh token. Attempting to find user by username to clear potential stale tokens.');

            // Attempt to find the user by username and clear any stale tokens
            const userByUsername = await User.findOne({ username: decoded.username });
            if (userByUsername) {
                await User.updateOne({ username: decoded.username }, { $set: { refreshToken: [] } });
                console.log('Cleared refresh tokens for user due to token misuse attempt.');
            }
            return res.sendStatus(403); // Forbidden
        }

        // Create new refresh and access tokens
        const newRefreshToken = jwt.sign({ username: foundUser.username }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
        const accessToken = jwt.sign({ UserInfo: { username: foundUser.username, roles: Object.values(foundUser.roles) } }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10s' });

        // Update user's refresh tokens list, removing the old one and adding the new one
        const updatedRefreshTokens = foundUser.refreshToken.filter(rt => rt !== refreshToken).concat(newRefreshToken);
        await User.findOneAndUpdate({ username: foundUser.username }, { $set: { refreshToken: updatedRefreshTokens } }, { new: true });

        // Send new tokens to the client
        res.cookie('jwt', newRefreshToken, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ roles: Object.values(foundUser.roles), accessToken });
    });
};


module.exports = { handleRefreshToken }