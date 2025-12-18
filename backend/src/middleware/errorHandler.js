const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Don't show in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message;

  res.status(err.status || 500).json({ error: message });
};

module.exports = errorHandler;
