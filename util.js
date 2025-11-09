const errorHandlerFunction = (msg, e, res) => {
  console.log(msg, e)
  return res.status(401).json({
    success: false,
    errors: {
      error: e.message || msg,
    },
  })
}

module.exports = {
  errorHandlerFunction,
}
