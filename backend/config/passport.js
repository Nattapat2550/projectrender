const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../db/db');
require('dotenv').config();

passport.serializeUser ((user, done) => {
  done(null, user.id);
});

passport.deserializeUser (async (id, done) => {
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

    let result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    if (result.rows.length > 0) {
      if (!result.rows[0].google_id) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, result.rows[0].id]);
        result.rows[0].google_id = googleId;
      }
      return done(null, result.rows[0]);
    } else {
      result = await pool.query(
        'INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING *',
        [name, email, googleId]
      );
      return done(null, result.rows[0]);
    }
  } catch (error) {
    return done(error, null);
  }
}));

module.exports = passport;