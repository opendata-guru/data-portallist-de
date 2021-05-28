'use strict';

const d3 = require('d3');
const fs = require('fs');

if (typeof fetch !== 'function') {
    global.fetch = require('node-fetch-polyfill');
}

// --------------------------------

const geodata = 'https://github.com/opendata-guru/data-portallist-de/raw/master/source/gemeinden_simplify200.geojson';
const portallist = 'https://github.com/opendata-guru/data-portallist-de/raw/master/dist/opendataportals.csv';
const geoPortalList = 'dist/opendataportals.geojson';

console.log('Loading geojson file...')
d3.json(geodata).then(geoData => {

    var world = geoData.features;
    console.log(`  ${world.length} municipals loaded`)

    console.log('Loading portal list...')
    d3.csv(portallist, portal => {

        let matchRS = false;
        let matchTitle = '';
        world.forEach(feature => {

            if (portal.rs === feature.properties.RS) {
                feature.properties = portal;
                matchRS = true;
            }
            if (portal.portal_title === feature.properties.GEN) {
                matchTitle = `  - ${feature.properties.GEN}, ${feature.properties.BEZ}, ${feature.properties.destatis.population} citizen, AGS: ${feature.properties.AGS}, RS: ${feature.properties.RS}`;
            }
        });

        if (!matchRS) {

            if (matchTitle === '') {
                console.log(`  - ${portal.portal_title} not found`);
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
