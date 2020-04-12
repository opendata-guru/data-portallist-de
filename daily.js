'use strict';

// --------------------------------

const pathDownload = 'downloads';
const pathDiff = 'diffs';

// --------------------------------

function getFileListing(relativePath, callback) {
	const path = require('path');
	const fs = require('fs');
	const directoryPath = path.join(__dirname, relativePath);

	fs.readdir(directoryPath, function (err, files) {
		if (err) {
			throw err
		}

		files = files.map(function (fileName) {
			return {
				name: fileName,
				time: fs.statSync(directoryPath + '/' + fileName).mtime.getTime()
			};
		})
		.sort(function (a, b) {
			return b.time - a.time;
		})
		.map(function (v) {
			return directoryPath + '/' + v.name;
		});

		callback(files);
	});
}

// --------------------------------

function readTwoJSONFiles(path1, path2, callback) {
	const fs = require('fs');

	fs.readFile(path1, (err, data1) => {
		if (err) {
			throw err
		}

		let obj1 = {};
		try {
			obj1 = JSON.parse(data1);
		} catch(e1) {
			console.log('error parsing', path1);
		}

		fs.readFile(path2, (err, data2) => {
			if (err) {
				throw err
			}

			let obj2 = {};
			try {
				obj2 = JSON.parse(data2);
			} catch(e2) {
				console.log('error parsing', path2);
			}

			callback(obj1, obj2);
		});
	});
}

// --------------------------------

function saveJSONFile(path, object) {
	const fs = require('fs');
	let data = JSON.stringify(object, null, 2);

	fs.writeFile(path, data, (err) => {
		if (err) {
			throw err
		}
	});
}

// --------------------------------

function getCKANAsArray(ckanObject) {
	if (ckanObject.success !== true) {
		throw 'CKAN not loaded successfully';
	}

	return ckanObject.result;
}

// --------------------------------

function compareTwoArrays(arrayNewer, arrayOlder) {
	let result = {
		info: {},
		data: {}
	};

	result.info.olderFile = arrayOlder.length;
	result.info.newerFile = arrayNewer.length;

	result.data.equal = arrayNewer.filter(x => arrayOlder.includes(x));
	result.info.equalItems = result.data.equal.length;

	result.data.added = arrayNewer.filter(x => !arrayOlder.includes(x));
	result.info.added = result.data.added.length;

	result.data.deleted = arrayOlder.filter(x => !arrayNewer.includes(x));
	result.info.deleted = result.data.deleted.length;

	result.data.difference = result.data.added.concat(result.data.deleted);
	result.info.difference = result.data.difference.length;

	return result;
}

// --------------------------------

function compareFolder(path) {
	console.log('  get dir for ' + path);

	const files = getFileListing(pathDownload + '/' + path, function(files) {
		if (files.length >= 2) {
			let path1 = files[0], path2 = files[1];
			if (path1.indexOf('.DS_Store') !== -1) {
				path1 = files[1];
				path2 = files[2];
			} else if (path2.indexOf('.DS_Store') !== -1) {
				path2 = files[2];
			}

			readTwoJSONFiles(path1, path2, function(objNewer, objOlder) {
				console.log('  get diff for last ' + path + ' files');

				let arrayNewer = [];
				let arrayOlder = [];

				try {
					arrayNewer = getCKANAsArray(objNewer);
				} catch(e1) {
					console.log('error converting CKAN to array', path1);
					return;
				}
				try {
					arrayOlder = getCKANAsArray(objOlder);
				} catch(e1) {
					console.log('error converting CKAN to array', path2);
					return;
				}
				let result = compareTwoArrays(arrayNewer, arrayOlder);

				delete result.data.equal;
				delete result.data.difference;

				path1 = path1.split('.')[path1.split('.').length - 2];
				path1 = path1.substr(-10);

				let file = path + '/diff-' + path1 + '.json';
				console.log('Write file /' + file);

				saveJSONFile(pathDiff + '/' + file, result);
			});
		}
	});
}

// --------------------------------

function getToday() {
	var d = new Date();

	return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

// --------------------------------

function curlWithCache(uri, path, callback) {
	const fs = require('fs');
	const request = require('request');

	fs.access(path, error => {
		if (!error) {
			callback(path);
		} else {
			console.log('  get uri', uri);

			request(uri, function (error, response, body) {
				if (!error && response.statusCode === 200) {
					const buffer = Buffer.from(body, 'utf8');
					fs.writeFileSync(path, buffer);

					callback(path);
				} else if (!response) {
					console.log('error from ' + uri + ' - no response');
				} else if (response.statusCode === 500) {
					console.log('error from ' + uri + ' ', response.statusCode);
					const buffer = Buffer.from(body, 'utf8');
					fs.writeFileSync(path, buffer);
				} else {
					console.log('error from ' + uri + ' ', response.statusCode);
				}
			})
		}
	});
}

// --------------------------------

console.log('');
console.log('Start');

let today = getToday();

curlWithCache('https://ckan.govdata.de/catalog.rdf', 'downloads/de-rdf/govdata-' + today + '.xml', function() {
//	compareFolder('de-rdf');
	console.log('Did not parse catalog.rdf from govdata.de');
});
curlWithCache('https://ckan.govdata.de/api/3/action/package_list', 'downloads/de/govdata-' + today + '.json', function() {
	compareFolder('de');
});
curlWithCache('https://www.data.gv.at/katalog/api/3/action/package_list', 'downloads/at/data-gv-' + today + '.json', function() {
	compareFolder('at');
});
curlWithCache('http://data.opendataportal.at/api/3/action/package_list', 'downloads/at-odp/opendataportal-' + today + '.json', function() {
	compareFolder('at-odp');
});
curlWithCache('https://opendata.swiss/api/3/action/package_list', 'downloads/ch/swiss-' + today + '.json', function() {
	compareFolder('ch');
});
