#!/bin/bash

today=`date +%Y-%m-%d`

curl https://ckan.govdata.de/catalog.rdf -o "downloads/de-rdf/govdata-$today.xml"
curl https://ckan.govdata.de/api/3/action/package_list -o "downloads/de/govdata-$today.json"
curl https://www.data.gv.at/katalog/api/3/action/package_list -o "downloads/at/data-gv-$today.json"
curl http://data.opendataportal.at/api/3/action/package_list -o "downloads/at-odp/opendataportal-$today.json"
curl https://opendata.swiss/api/3/action/package_list -o "downloads/ch/swiss-$today.json"
