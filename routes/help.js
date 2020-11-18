module.exports = (router) => {
	router.get("/", (req, res) => {
		res.render("help/root")
	});

	router.get("/get_app", (req, res) => {
		res.render("help/get_app")
	});

	router.get("/app_info", (req, res) => {
		res.render("help/app_info")
	});

	return router;
};
