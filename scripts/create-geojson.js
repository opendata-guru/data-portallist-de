'use strict';

const d3 = require('d3');
const fs = require('fs');

if (typeof fetch !== 'function') {
    global.fetch = require('node-fetch-polyfill');
}

// --------------------------------

const geodata = './source/gemeinden_simplify200.geojson';
const portallist = 'https://github.com/opendata-guru/data-portallist-de/raw/master/dist/opendataportals.csv';
const geoPortalList = 'dist/opendataportals.geojson';

function readJSON(filePath) {
    return new Promise(function(resolve, reject) {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(Error(err));
            }

            resolve(JSON.parse(data));
        });
    });
}

console.log('Loading geojson file...');
readJSON(geodata).then(geoData => {

    var world = geoData.features;
    console.log(`  ${world.length} municipals loaded`)

    console.log('Loading portal list...')
    d3.csv(portallist, portal => {

        let matchRS = false;
        let matchTitle = '';
        let subTitle = '';
        world.forEach(feature => {

            if (portal.rs === feature.properties.RS) {
                feature.properties = portal;
                matchRS = true;
            } else if (portal.portal_title === feature.properties.GEN) {
                matchTitle = `  - ${feature.properties.GEN}, ${feature.properties.BEZ}, ${feature.properties.destatis.population} citizen, NUTS: ${feature.properties.NUTS}, AGS: ${feature.properties.AGS}, RS: ${feature.properties.RS}`;
            } else if (portal.portal_title && (-1 < portal.portal_title.indexOf(feature.properties.GEN))) {
                if (subTitle === '') {
                    subTitle = `${portal.portal_title} may be:`;
                }
                subTitle += `\n    ${feature.properties.GEN}, ${feature.properties.BEZ}, ${feature.properties.destatis.population} citizen, NUTS: ${feature.properties.NUTS}, AGS: ${feature.properties.AGS}, RS: ${feature.properties.RS}`;
            } else if (feature.properties.GEN && (-1 < feature.properties.GEN.indexOf(portal.portal_title))) {
                if (subTitle === '') {
                    subTitle = `${portal.portal_title} may be:`;
                }
                subTitle += `\n    ${feature.properties.GEN}, ${feature.properties.BEZ}, NUTS: ${feature.properties.NUTS}, AGS: ${feature.properties.AGS}, RS: ${feature.properties.RS}`;
            }
        });

        if (!matchRS) {

            if (matchTitle === '') {
                if (subTitle === '') {
                    console.log(`  - ${portal.portal_title} not found`);
                } else {
                    console.log(`  - ${subTitle}`);
                }
            } else {
                console.log(matchTitle);
            }
        }
    }).then(data => {

        const smallWorld = world.filter(feature => feature.properties.portal_title !== undefined);
        console.log(`  ${smallWorld.length} portals loaded`)

        geoData.features = smallWorld;

        fs.writeFile(geoPortalList, JSON.stringify(geoData), 'utf8', err => {
            if (err) {
                return console.log(err);
            }

            console.log('Saved');
        });

    });

});

// --------------------------------
