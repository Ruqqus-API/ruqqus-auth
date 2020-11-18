const { getAuthURL } = require("ruqqus-js");
const { v4: uuidv4 } = require('uuid');
const needle = require('needle');
const url = require('url');

const temp = []

module.exports = {
	path: "/",
	config: (router) => {
		router.get("/", (req, res) => {
			res.render("index");
		})
		router.post("/auth", (req, res) => {
			const state_token = uuidv4();
			const { client_secret, client_id, scope_list } = req.body;

			temp.push({ uuid: state_token, client_secret: client_secret, client_id: client_id, timestamp: unixEpoch() })

			res.redirect(getAuthURL({
				id: client_id,
				redirect: "https://ruqqus-auth.glitch.me/redirect",
				state: state_token,
				scopes: scope_list.replace(/\s+/g, ''),
				permanent: true
			}));
		});

		router.post("/refresh", (req, res) => {
			const { client_secret, client_id, refresh_token } = req.body;

			var r = {
				client_id: client_id,
				client_secret: client_secret,
				grant_type: 'refresh',
				refresh_token: refresh_token,
			}

			needle.post('https://ruqqus.com/oauth/grant', r, function (err, resp, body) {
				if (err) throw (err);
				body.expires_at_human_readable = new Date(body.expires_at * 1000)
				res.render("results", { data: body });
			});
		})

		router.get("/redirect", (req, res) => {
			const { code, state } = req.query
			var data = temp.find(d => d.uuid == state);

			var r = {
				client_id: data.client_id,
				client_secret: data.client_secret,
				grant_type: 'code',
				code: code,
			}

			needle.post('https://ruqqus.com/oauth/grant', r, function (err, resp, body) {
				if (err) throw (err);
				body.expires_at_human_readable = new Date(body.expires_at * 1000)
				temp.splice(temp.indexOf(data), 1);

				res.redirect(url.format({
					pathname: "/results",
					query: {
						"access_token": body.access_token,
						"refresh_token": body.refresh_token,
						"scopes": body.scopes,
						"expires_at": body.expires_at,
						"expires_at_human_readable": body.expires_at_human_readable
					}
				}))

			});
		})

		router.get("/results", (req, res) => {

			const { access_token, refresh_token, scopes, expires_at, expires_at_human_readable } = req.query
			const data = {
				access_token: access_token,
				refresh_token: refresh_token,
				scopes: scopes,
				expires_at: expires_at,
				expires_at_human_readable: expires_at_human_readable
			}

			res.render("results", { data: data });

		})
		return router;
	},
};


function unixEpoch() {
	return Math.floor(new Date().getTime() / 1000)
}

// Every minute check if the user session expired, if so delete it (user session lasts for 5 minutes)
const minutes = 1, the_interval = minutes * 60 * 1000;
setInterval(function () {
	temp.forEach(o => {
		if (unixEpoch() - o.timestamp >= 300) {
			temp.splice(temp.indexOf(o), 1);
		}
	})
}, the_interval);

