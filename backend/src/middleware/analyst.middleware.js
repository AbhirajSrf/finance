export const analystRoute = (req, res, next) => {
  if (req.user && ["analyst", "admin"].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({
    message: "Access denied. Analyst or Admin role required.",
  });
};
