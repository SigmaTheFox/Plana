const { readFileSync } = require('fs');

let localization = () => {
	return JSON.parse(readFileSync('./json/localization.json'));
};
let students = () => {
	return JSON.parse(readFileSync('./json/students.json'));
};
let validStudentNames = () => {
	return Object.values(students()).map(student => student.Name);
};

module.exports = {
	localization,
	students,
	validStudentNames,
};
