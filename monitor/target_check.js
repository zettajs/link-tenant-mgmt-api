var http = require('http');
var url = require('url');
var jwt = require('jsonwebtoken');

function once(cb) {
  var called = false;
  return function() {
    if (!called) {
      called = true;
      cb.apply(null, arguments);
    }
  };
}

module.exports = function(opts, target, callback) {
  // Ensure it's only every called once
  // timeout reached can also propigate an req.error when req.abort is called
  callback = once(callback);

  var parsed = url.parse(target.url); // use private url so SG can still work
  var options = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: '/'
  };

  if (opts.jwtPlaintextKeys) {
    var token = { location: target.url }; // location needs to be publicUrl
    var cipher = jwt.sign(token, opts.jwtPlaintextKeys.internal, { expiresIn: 60 });

    if (!options.headers) {
      options.headers = {};
    }
    
    options.headers['x-apigee-iot-jwt'] = cipher;
  }

  var req = http.request(options, function(res) {
    clearTimeout(timer);
    res.on('data', function () {});
    if (res.statusCode !== 200) {
      return callback(false, new Error('Status code did not match 200'));
    }
    
    return callback(true);
  });

  req.once('error', function(err) {
    clearTimeout(timer);
    return callback(false, err);
  });

  // timeout timer
  var timer = setTimeout(function() {
    req.abort();
    callback(false, new Error('Timeout reached'));
  }, opts.Timeout);

  req.end();
};
