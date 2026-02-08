const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("../models/User");

module.exports = function (passport) {

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (emailOrUsername, password, done) => {
        try {
          // Find user by email OR username
          const user = await User.findOne({
            $or: [
              { email: emailOrUsername },
              { username: emailOrUsername }
            ]
          });
          
          if (!user) return done(null, false, { message: "Invalid credentials" });

          const match = await bcrypt.compare(password, user.password);
          if (!match) return done(null, false, { message: "Invalid credentials" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // 🔥 FIX IS HERE
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};

