#!/bin/bash

today=`date +%Y-%m-%d`

curl https://ckan.govdata.de/catalog.rdf -o "downloads/de-rdf-$today.xml"
curl https://ckan.govdata.de/api/3/action/package_list -o "downloads/de-gov-$today.json"
curl https://www.data.gv.at/katalog/api/3/action/package_list -o "downloads/at-gov-$today.json"
curl http://data.opendataportal.at/api/3/action/package_list -o "downloads/at-dataportal-$today.json"
curl https://opendata.swiss/api/3/action/package_list -o "downloads/ch-gov-$today.json"
