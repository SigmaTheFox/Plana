const cron = require('node-cron');

module.exports = bot => {
	console.log('Plana is ready');

	cron.schedule('0 0 * * *', () => {
		require('../modules/getStudents')();
	});
};
