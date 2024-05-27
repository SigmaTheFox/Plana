const cron = require('node-cron');

module.exports = bot => {
	require('../modules/getStudents')();
	console.log('Plana is ready');

	cron.schedule('0 14 * * 2-4', () => {
		require('../modules/getStudents')();
	});
};
