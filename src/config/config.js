const dotenv = require('dotenv');

const program = require('../utils/commander.js');

const { mode } = program.opts();

dotenv.config({
    path: mode === 'production' ? './env.production' : "./.env.development"
})

const configObject = {
    mongo_url: process.env.MONGO_URL,
    secretWord: process.env.SECRET_WORD,
    port: process.env.PORT,
    
}

module.exports = configObject;