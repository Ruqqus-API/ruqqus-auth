const express = require("express");
const { getFiles } = require("../helpers/tools.js");

module.exports = (app) => {
	const routes = getFiles('routes')

	routes.forEach(r => {
		const file = r.substring(7)
		if (file === "index.js") return;
		const router = express.Router();
		const routeModule = require(require("path").join(__dirname, file));
		const path = routeModule.path || "/" + (file !== "root.js" ? file.replace(".js", "") : "");
		const route = routeModule.config ? routeModule.config(router) : routeModule(router);
		app.use(path, route);

	});
};
