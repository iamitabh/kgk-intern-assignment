const express = require('express')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const {Client} = require('pg')
const app = express()

const secretKey = process.env.secretKey;

// Function to generate access token
function generateAccessToken(email) {
    return jwt.sign({ email }, secretKey, { expiresIn: '15m' }); // Token expires in 15 minutes
}

// Function to generate refresh token
function generateRefreshToken(email) {
    return jwt.sign({ email }, secretKey, { expiresIn: '7d' }); // Token expires in 7 days
}

const client = new Client({
    host: process.env.host,
    user: process.env.user,
    database: process.env.database,
    port: process.env.port,
    password: process.env.password 
})

client.connect()
    .then(() => console.log(`connected to pg`))
    .catch((err) => console.log(err));

app.use(express.json())

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            "status": "Unauthorized"
        });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(401).json({
                "status": "Forbidden"
            });
        }
        req.user = user;
        next();
    });
}


app.get('/test', (req, res) => {
    res.status(200).json({ success: true });
})



// Function to post data to the database
async function postData(id, email, password) {
    const insertQuery = 'INSERT INTO auth(id, email, password) VALUES($1, $2, $3)';
    const values = [id, email, password];

    try {
        await client.query(insertQuery, values);
        console.log('Data inserted successfully');
    } catch (err) {
        console.error('Error inserting data', err);
        throw err;
    }
}

/*

{
    "name": "ahkjd",
    "password": "fjkaf;" 
}

*/

app.post('/register', async (req, res) => {

    const { email, password } = req.body;

    try {
        // Fetching count of records from the database
        const countResponse = await client.query('SELECT count(*) FROM auth;');
        const count = countResponse.rows[0].count;
        const id = parseInt(count) + 1;

        // Insert data into the database
        await postData(id, email, password);

        res.status(200).json({
            accessToken: generateAccessToken(email),
            refreshToken: generateRefreshToken(email)
        });
    } catch (err) {
        console.error(err);
    }
})


// Function to retrieve user data by email
async function getUserByEmail(email) {
    const loginQuery = 'SELECT * FROM auth WHERE email = $1';
    const values = [email];

    try {
        const result = await client.query(loginQuery, values);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (err) {
        console.error('Error fetching user by email:', err);
        throw err;
    }
}

/*

{
    "name": "ahkjd",
    "password": "fjkaf;" 
}

*/

app.post('/login', async (req, res) => {

    const { email, password } = req.body;

    try {

        const userData = await getUserByEmail(email);

        if (!userData) {
            return res.status(404).json({ message: 'Email not found.' });
        }

        if (userData.password !== password) {
            return res.status(404).json({ message: 'Password is not correct.' });
        }

        // Generate tokens and send response
        res.status(200).json({
            accessToken: generateAccessToken(email),
            refreshToken: generateRefreshToken(email)
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Internal Server Error');
    }
})

app.get('/dashboard', authenticateToken, (req, res) => {

    const user = req.user.email; 

    async function getUser() {

        try{

            const email = user.email;

            const fetchingUser = 'SELECT * FROM auth WHERE email = $1';
            const value = [email];

            const checkQuery = await client.query(fetchingUser, value);
            const obj = checkQuery.rows[0];

            res.status(200).json({ ...obj });

        }
        catch(err) {
            console.log(err);
        }

    }
    getUser();

})

app.post('/refresh-token', (req, res) => {
    const refreshToken = req.body.refreshToken;

    // Check if refresh token is provided
    if (!refreshToken) {
        return res.status(400).json({
            "status": "no refresh token provided"
        }); // Bad request
    }

    // Verify refresh token
    jwt.verify(refreshToken, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({
                "status": "Corresponding User not found with this token"
            }); // Forbidden (invalid refresh token)
        }

        // Refresh token is valid, generate new access token
        const accessToken = generateAccessToken(user);

        // Respond with the new access token
        return res.status(200).json({ accessToken });
    });
});

app.listen(3000, () => {
    console.log('Server is running...')
})