const express = require("express");
const tools = require("../helpers/tools.js")

module.exports = (app) => {

	app.use((req, res, next) => {
		res.status(404).render('errors/404');
	});

	app.use((err, req, res, next) => {

		const e = []
		const error_templates = tools.getFiles(tools.rootPath + "/views/errors")
		error_templates.forEach(error_template => {
			e.push(error_template.substring(error_template.length, error_template.lastIndexOf("/") + 1).replace(".ejs", ""));
		});

		if (e.includes(err.toString())) {
			res.status(err).render(`errors/${err}`)
		} else {
			if (err.status) {
				res.status(err.status).render(`errors/custom`, { error: { status: err.status, message: err.message, detail: err.detail } });
			} else {
				res.status(err).render(`errors/custom`, { error: { status: err } });
			}
		}
	})

};
