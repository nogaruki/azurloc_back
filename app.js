require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const credentials = require('./middleware/credentials');
const connectDB = require('./utils/dbConnection');
const mongoose = require("mongoose");
const PORT = process.env.PORT || 3500;

//connect to DB
connectDB();

// custom middleware logger
app.use(logger);

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: true }));

// built-in middleware for json
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

// Error handling middleware
app.use(errorHandler);

if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET is not defined');
} else if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET is not defined');
} else if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
} else if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not defined');
} else if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_SECRET is not defined');
} else if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error('GOOGLE_REFRESH_TOKEN is not defined');
} else if (!process.env.GOOGLE_EMAIL) {
    throw new Error('GOOGLE_EMAIL is not defined');
}

const prefix = '/api';

app.use('/auth', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));

app.use(prefix +'/user', require('./routes/api/users'));
app.use(prefix +'/activities', require('./routes/api/activity'));
app.use(prefix +'/categories', require('./routes/api/category'));
app.user('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
});

mongoose.connection.once('open', () => {
    console.log('MongoDB is Connected...');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

module.exports = app;