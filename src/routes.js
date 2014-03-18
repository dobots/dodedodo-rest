/**
 * These are the routes on the server side. All the REST methods (GET, POST, PUT, DELETE) go to the same controller 
 * methods. Within the controller, you can inspect req.method to know which REST method is used.
 *
 * See: https://github.com/twilson63/express-coffee/blob/master/src/routes.coffee
 */
routeMvc = function(controllerName, methodName, req, res, next) {
	if (typeof controllerName == "undefined" || controllerName == null) {
		controllerName = 'index';
	}
	controller = null;
	if (controllerName === 'js') { // things like  /js/angular/angular.min.js.map
		next();
		return;
	}
	console.log("Route:" + controllerName);
	try {
		controller = require("./controllers/" + controllerName);
	} catch(e) {
		try {
			controller = require("./controllers/" + controllerName + '.js');
		} catch(e) {
			console.warn("Controller not found: " + controllerName, e);
			next();
			return;
		}
	}
	if (typeof controller[methodName] == "function") {
		req.session.lastPage = '/' + controllerName;
		actionMethod = controller[methodName].bind(controller);
		actionMethod(req, res, next);
	}
	else {
		console.warn("Method not found: " + methodName);
		next();
	}
};

/**
 * The routes are defined here. We accept a route up to three levels: controller name, method name, and identifier.
 */
module.exports = function(app) {

	/**
	 * To implement authorization for a certain route, which is on the moment done e.g. user.js itself, you can also
	 * add a route here in the form of app.all('/', checkAuth, function (req, res, next) { ... } before the more 
	 * general routes.
	 */
	checkAuth = function(req, res, next) {
		//console.log('Session in checkAuth', req.session)
		if (!req.session.authorized) {
			console.warn("error 401: ", req.url);
			res.statusCode = 401;
			res.render('401', 401);
		} else {
			next();
		}
	}

	// "/" goes to controllers/index/index
	app.all('/', function (req, res, next) {
		routeMvc('index', 'index', req, res, next)
	});

	app.get('/partials/:name', function (req, res) { 
		var name = req.params.name;
		res.render('partials/' + name);
	});

	// <controller> goes to controllers/<controller>/index
	app.all('/:controller', function (req, res, next) {
		routeMvc(req.params.controller, 'index', req, res, next)
	});

	// <controller>/<method> goes to controllers/<controller>/<method>
	app.all('/:controller/:method', function (req, res, next) {
		routeMvc(req.params.controller, req.params.method, req, res, next)
	});

	// <controller>/<method>/<id> goes to controllers/<controller>/<method> with <id> as param
	app.all('/:controller/:method/:id', function (req, res, next) {
		routeMvc(req.params.controller, req.params.method, req, res, next)
	});

	// If all else failed, show 404 page
	app.all('/*', function (req, res, next) {
		console.warn("error 404: ", req.url);
		res.statusCode = 404;
		res.send( { error: 'Not found, error 404' });
	 	next();
	});
};
