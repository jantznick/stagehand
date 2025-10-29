
export const isSuperAdmin = (req, res, next) => {
    // This middleware must run after the standard authentication middleware
    if (req.isAuthenticated() && req.user && req.user.isSuperAdmin) {
        return next();
    }
    return res.status(403).json({ error: 'Forbidden: Requires super administrator privileges.' });
};
