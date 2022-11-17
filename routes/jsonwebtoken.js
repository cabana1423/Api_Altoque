const jwt = require('jsonwebtoken')
const config = require('./config.json')

module.exports = (req,res,next) => {
  const token = req.body.token || req.query.token || req.headers['token']
  console.log(token);
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) {
            console.log('acceso denegado');
            return res.status(300).json({"error": true, "msn": 'toquen expirado'});
        }
      req.decoded = decoded;
      next();
    });
  } else {
    // if there is no token
    // return an error
    return res.status(300).send({
        "error": true,
        "msn": 'sin token de acceso'
    });
  }
}