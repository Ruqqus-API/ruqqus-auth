module.exports = {
    path: "/",
    config: (router) => {
        router
            .get("/", (req, res) => {
				console.log(req.ip)
				res.render("index");
				
			})
            .post("/", (req, res) => res.send("POST"));
        return router;
    },
};