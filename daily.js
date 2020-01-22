'use strict';

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

		console.log('Data written to file ' + path);
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
	console.log('get dir for ' + path);

	const files = getFileListing('downloads/' + path, function(files) {
		if (files.length >= 2) {
			console.log('load last two files');

			let path1 = files[0], path2 = files[1];
			if (path1.indexOf('.DS_Store') !== -1) {
				path1 = files[1];
				path2 = files[2];
			} else if (path2.indexOf('.DS_Store') !== -1) {
				path2 = files[2];
			}

			readTwoJSONFiles(path1, path2, function(objNewer, objOlder) {
				console.log('compare 2 files');

				let arrayNewer = getCKANAsArray(objNewer);
				let arrayOlder = getCKANAsArray(objOlder);
				let result = compareTwoArrays(arrayNewer, arrayOlder);

				delete result.data.equal;
				delete result.data.difference;

				saveJSONFile('test.json', result);
			});
		}
	});
}

// --------------------------------

console.log('');

compareFolder('de');
