const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../db/db');
require('dotenv').config();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const googleId = profile.id;
    const name = profile.displayName;
    const photo = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

    // Check if user exists by email or google_id
    let result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR google_id = $2',
      [email, googleId]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      // Update user record if needed
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
      }
      if (!user.profile_pic || user.profile_pic === 'user.png') {
        await pool.query('UPDATE users SET profile_pic = $1 WHERE id = $2', [photo, user.id]);
        user.profile_pic = photo;
      }
      
      return done(null, user);
    } else {
      // Create new user with Google data
      result = await pool.query(
        'INSERT INTO users (name, email, google_id, profile_pic) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, googleId, photo]
      );
      return done(null, result.rows[0]);
    }
  } catch (error) {
    return done(error, null);
  }
}));

module.exports = passport;