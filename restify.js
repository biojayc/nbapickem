var fs = require("fs"),
    http = require('http'),
    url = require('url'),
    zlib = require('zlib'),
    log = require('./log');

var routes = [];
var errorHandler = {};

var findRoute = function(path, method) {
  for (var i = 0; i < routes.length; i++) {
    if (path.match("^" + routes[i].route + "$") && 
        (method == routes[i].method || routes[i].method == "*")) {
      log.info("Route found: " + routes[i].method + " " + routes[i].route);
      return routes[i].handler;
    }
  }
  if (errorHandler) {
    log.info("No Route found, returning 404 error handler");
    return errorHandler;
  }
};

var startWebServer = function(port, ip) {
  var server = http.createServer(function (req, res) {
    var path = url.parse(req.url).pathname;
    log.info("Incoming Request for: " + req.method + " " + path);
    var handler = findRoute(path, req.method);
    handler(req, res);
    
  })
  if (ip) {
    server.listen(port, ip);
    log.info("Webserver running on " + ip + ":" + port);
  } else {
    server.listen(port);
    log.info("Webserver running on port " + port);
  }
}

var registerRoute = function(route, method, handler) {
  log.info("Registering Route: " + method + " " + route);
  if (route == "404") {
    errorHandler = handler;
  } else {
    routes.push({ route: route, method: method, handler: handler });
  }
};

var registerStatic = function(path, realpath) {
  log.info("Registering static path: " + path);
  routes.push({ 
    route: path, 
    method: "GET", 
    handler: function(req, res) {
      var filename = req.url;
      if (realpath) {
        filename = filename.replace(path.replace(".*", ""), realpath);
        
      }
      log.info("Returning " + filename);
      var raw = fs.createReadStream("." + filename);
      var acceptEncoding = req.headers['accept-encoding'];
      if (!acceptEncoding) {
        acceptEncoding = '';
      }
      if (acceptEncoding.match(/\bdeflat\b/)) {
        res.writeHead(200, { 'content-encoding': 'deflate' });
        raw.pipe(zlib.createDeflate()).pipe(res);
      } else if (acceptEncoding.match(/\bgzip\b/)) {
        res.writeHead(200, { 'content-encoding' : 'gzip' });
        raw.pipe(zlib.createGzip()).pipe(res);
      } else {
        res.writeHead(200, {});
        raw.pipe(res);
      }
    }
  });
};

exports.startWebServer = startWebServer;
exports.registerRoute = registerRoute;
exports.registerStatic = registerStatic;
