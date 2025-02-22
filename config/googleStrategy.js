const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { firebaseAuth } = require('./firebase'); // Adjust the path as necessary

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET, // Use your JWT secret
};

const googleStrategy = new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    // Verify the Google ID token
    const userRecord = await firebaseAuth.getUser(jwt_payload.uid);
    if (!userRecord) {
      return done(null, false); // User not found
    }
    return done(null, userRecord); // User found
  } catch (error) {
    return done(error, false);
  }
});

module.exports = googleStrategy; 