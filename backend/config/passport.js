const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../db/db');

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
}, async (request, accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2', 
      [profile.id, profile.emails[0].value]
    );
    
    if (result.rows.length > 0) {
      // Update google_id if not set
      if (!result.rows[0].google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1 WHERE id = $2',
          [profile.id, result.rows[0].id]
        );
        result.rows[0].google_id = profile.id;
      }
      return done(null, result.rows[0]);
    } else {
      // Create new user
      result = await pool.query(
        'INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING *',
        [profile.displayName, profile.emails[0].value, profile.id]
      );
      return done(null, result.rows[0]);
    }
  } catch (error) {
    return done(error, null);
  }
}));

module.exports = passport;