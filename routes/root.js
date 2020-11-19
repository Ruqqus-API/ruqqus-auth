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
			var { client_secret, client_id, scope_list } = req.body;

			scope_list = scope_list.replace(/\s+/g, '')

			scope_list.split(',').forEach(scope => {
				if (!scopes.includes(scope)) {
					throw ({ status: 405, message: 'Not allowed!', detail: 'Your scopes are not valid!' })
				}
			})

			temp.push({ uuid: state_token, client_secret: client_secret, client_id: client_id, timestamp: unixEpoch() })

			res.redirect(Ruqqus.getAuthURL({
				id: client_id,
				redirect: 'https://ruqqus-auth.glitch.me/redirect',
				state: state_token,
				scopes: scope_list,
				permanent: true
			}));
		});

		router.post('/refresh', (req, res) => {
			const { client_secret, client_id, refresh_token } = req.body;

			Ruqqus.fetchTokens({
				id: client_id,
				token: client_secret,
				type: "code/refresh",
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

			const { access_token, refresh_token, scopes, expires_at, expires_at_human_readable } = req.query
			const data = {
				access_token: access_token,
				refresh_token: refresh_token,
				scopes: scopes,
				expires_at: expires_at,
				expires_at_human_readable: expires_at_human_readable
			}

			res.render('results', { data: data });

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

