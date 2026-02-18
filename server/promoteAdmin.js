const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const promoteEmail = process.argv[2];

if (!promoteEmail) {
    console.log('Please provide an email. Usage: node promoteAdmin.js your-email@example.com');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB connected');

        const user = await User.findOne({ email: promoteEmail });

        if (!user) {
            console.log(`User with email ${promoteEmail} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`Successfully promoted ${promoteEmail} to ADMIN!`);
        console.log('You can now log out and log back in to use admin features.');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
