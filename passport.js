const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const { firebaseAuth, firebaseDb } = require("./config/firebase");
const dotenv = require("dotenv");

dotenv.config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT token from Authorization header
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new Strategy(opts, async (jwt_payload, done) => {
    try {
      console.log("Passport Debug - JWT Payload:", jwt_payload);

      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (jwt_payload.exp && jwt_payload.exp < now) {
        console.log("Passport Debug - Token expired");
        return done(null, false, { message: "Token expired" });
      }

      // Verify the user exists in Firebase Auth
      const user = await firebaseAuth.getUser(jwt_payload.uid);

      if (!user) {
        console.log("Passport Debug - User not found in Firebase Auth");
        return done(null, false, { message: "User not found" });
      }

      // Check both users and admins collections
      const [userDoc, adminDoc] = await Promise.all([
        firebaseDb.collection("users").doc(jwt_payload.uid).get(),
        firebaseDb.collection("admins").doc(jwt_payload.uid).get(),
      ]);

      let userData;
      let isAdmin = false;

      if (adminDoc.exists) {
        userData = adminDoc.data();
        isAdmin = true;
      } else if (userDoc.exists) {
        userData = userDoc.data();
      } else {
        console.log(
          "Passport Debug - User document not found in either collection"
        );
        return done(null, false, { message: "User document not found" });
      }

      // Verify that the user has the roles claimed in the JWT
      const storedRoles = userData?.roles || [];
      const tokenRoles = jwt_payload.roles || [];

      console.log("Passport Debug - Comparing roles:", {
        storedRoles,
        tokenRoles,
      });

      // Create enhanced user object with verified roles
      const enhancedUser = {
        uid: user.uid,
        email: user.email,
        roles: storedRoles, // Use roles from Firestore, not from token
        isAdmin,
        customData: userData,
      };

      console.log("Passport Debug - Enhanced User:", enhancedUser);
      return done(null, enhancedUser);
    } catch (error) {
      console.error("Error in passport strategy:", error);
      return done(error, false);
    }
  })
);
