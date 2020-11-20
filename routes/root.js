const { v4: uuidv4 } = require('uuid');
const url = require('url');
const Ruqqus = require('ruqqus-js')

const scopes = ['identity', 'create', 'read', 'update', 'delete', 'vote', 'guildmaster']
const temp = []

module.exports = {
	path: '/',
	config: (router) => {
		router.get('/', (req, res) => {
			res.render('index');
		})
		router.post('/auth', (req, res) => {
			const state_token = uuidv4();
			var { client_secret, client_id, custom_uri, scope_list, permanent } = req.body;

			var redirect = 'https://ruqqus-auth.glitch.me/redirect'
			if (custom_uri) {
				redirect = custom_uri
			} else {
				temp.push({ uuid: state_token, client_secret, client_id, timestamp: unixEpoch() })
			}

			scope_list = scope_list.replace(/\s+/g, '')

			scope_list.split(',').forEach(scope => {
				if (!scopes.includes(scope)) {
					throw ({ status: 405, message: 'Not allowed!', detail: 'Your scopes are not valid!' })
				}
			})

			res.redirect(Ruqqus.getAuthURL({
				id: client_id,
				redirect: redirect,
				state: state_token,
				scopes: scope_list,
				permanent: Boolean(permanent)
			}));
		});

		router.post('/refresh', (req, res) => {
			const { client_secret, client_id, refresh_token } = req.body;

			Ruqqus.fetchTokens({
				id: client_id,
				token: client_secret,
				type: "refresh",
				refresh: refresh_token
			}).then(response => {
				response.expires_at_human_readable = new Date(response.expires_at * 1000)
				res.render('results', { data: response });
			}).catch(err => {
				console.log(err)
				throw (err);
			})

		})

		router.get('/redirect', (req, res) => {
			const { code, state } = req.query
			var data = temp.find(d => d.uuid == state);

			if (!data) throw ({ status: 401, message: 'Unauthorized!', detail: 'Your session most likely expired (5 minutes)' })

			Ruqqus.fetchTokens({
				id: data.client_id,
				token: data.client_secret,
				type: "code",
				code: code

			}).then(response => {
				temp.splice(temp.indexOf(response), 1);
				res.redirect(url.format({
					pathname: '/results',
					query: {
						'access_token': response.access_token,
						'refresh_token': response.refresh_token,
						'scopes': response.scopes,
						'expires_at': response.expires_at,
						'expires_at_human_readable': Date(response.expires_at * 1000)
					}
				}))
			}).catch(err => {
				console.log(err)
				throw (err);
			})

		})

		router.get('/results', (req, res) => {
			res.render('results', { data: req.query });

		})
		return router;
	},
};


const unixEpoch = () => Math.floor(new Date().getTime() / 1000)

// Every minute check if the user session expired, if so delete it (user session lasts for 5 minutes)
const minutes = 1, the_interval = minutes * 60 * 1000;
setInterval(() => {
	temp.forEach(o => {
		if (unixEpoch() - o.timestamp >= 300) {
			temp.splice(temp.indexOf(o), 1);
		}
	})
}, the_interval);

