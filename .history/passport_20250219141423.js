const passport = require("passport");
const { ExtractJwt, Strategy: JwtStrategy } = require("passport-jwt");
const { firebaseAuth } = require("../config/firebase"); // assuming firebaseAuth is set up in firebase.js
const dotenv = require("dotenv");

dotenv.config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT token from Authorization header
  secretOrKey: process.env.JWT_SECRET, // You can also use a public key if using RSA, but symmetric key is simpler for JWT
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      // Verify the JWT by checking if the user exists in Firebase
      const userRecord = await firebaseAuth.getUser(jwt_payload.uid);
      if (!userRecord) {
        return done(null, false); // User not found
      }
      return done(null, userRecord); // User found
    } catch (error) {
      return done(error, false);
    }
  })
);
