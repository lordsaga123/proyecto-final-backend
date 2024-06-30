const passport = require('passport');

function authMiddleware(req, res, next) {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.user = null;
        } else {
            req.user = user;
            res.locals.userRole = user.role;
            res.locals.userEmail = user.email;
        }
        next();
    })(req, res, next);
}

module.exports = authMiddleware;