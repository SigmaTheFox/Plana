const { createWriteStream } = require('fs');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

module.exports = async () => {
	await students();
	await Localization();
};

async function students() {
	const studentsURL = 'https://schaledb.com/data/en/students.min.json';

	try {
		const students = createWriteStream('./json/students.json');
		const { body } = await fetch(studentsURL);
		await finished(Readable.fromWeb(body).pipe(students));
		students.close();
	} catch (err) {
		console.error(err);
	}
}

async function Localization() {
	const localizationURL = 'https://schaledb.com/data/en/localization.min.json';

	try {
		const localization = createWriteStream('./json/localization.json');
		const { body } = await fetch(localizationURL);
		await finished(Readable.fromWeb(body).pipe(localization));
		localization.close();
	} catch (err) {
		console.error(err);
	}
}
