const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const { firebaseAuth } = require("./config/firebase");
const dotenv = require("dotenv");

dotenv.config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT token from Authorization header
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new Strategy(opts, async (jwt_payload, done) => {
    console.log("JWT Payload:", jwt_payload); // Log the payload
    try {
      // Verify the JWT by checking if the user exists in Firebase
      const user = await firebaseAuth.getUser(jwt_payload.uid);
      console.log("User from Firebase:", user);
      if (user) {
        return done(null, user); // User found
      } else {
        return done(null, false); // User not found
      }
    } catch (error) {
      console.error("Error in passport strategy:", error);
      return done(error, false);
    }
  })
);
