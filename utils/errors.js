class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VALIDATION_ERROR';
  }
}

module.exports = {
  ValidationError,
};
