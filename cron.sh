#!/bin/bash

# Kosmos Updater Server
# Copyright (C) 2019 Nichole Mattera
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

resourceDirectory=$(jq -r '.resourceDirectory' ./config.json)

update_kosmos () {
    releaseResponseFilename=$(uuidgen)
    downloadFilename=$(uuidgen)

    curl -H "Accept: application/json" -H "Content-Type: application/json" -H "User-Agent: KosmosUpdaterServer/1.0.0" -s https://api.github.com/repos/AtlasNX/Kosmos/releases/latest >> /tmp/${releaseResponseFilename}
    if [ ! -f "/tmp/${releaseResponseFilename}" ] ;
    then
        return
    fi

    # Get latest version number
    version=$(jq -r '.tag_name' /tmp/${releaseResponseFilename})
    
    # Get latest app
    numberOfAssets=$(jq -r '.assets | length' /tmp/${releaseResponseFilename})
    for (( i=0; i<${numberOfAssets}; i++ ))
    do
        name=$(jq -r ".assets[${i}].name" /tmp/${releaseResponseFilename} | tr '[:upper:]' '[:lower:]')
        browserDownloadUrl=$(jq -r ".assets[${i}].browser_download_url" /tmp/${releaseResponseFilename})
        if [[ ${name} == kosmos* && ${name} == *zip ]] ;
        then
            curl -L -H "User-Agent: KosmosUpdaterServer/1.0.0" -s ${browserDownloadUrl} >> /tmp/${downloadFilename}
            break
        fi
    done
    
    # No asset found or download failed
    if [ ! -f "/tmp/${downloadFilename}" ] ;
    then
        rm -f /tmp/${releaseResponseFilename}
        return
    fi

    # Remove old files
    rm -f "${resourceDirectory}/KosmosVersion.txt"
    rm -f "${resourceDirectory}/Kosmos.zip"

    # Write Version
    echo -n $version >> "${resourceDirectory}/KosmosVersion.txt"

    # Repackage the zip file without Hekate payload and Kosmos Updater
    tempDirectory="/tmp/$(uuidgen)"
    mkdir -p ${tempDirectory}
    unzip -qq /tmp/${downloadFilename} -d ${tempDirectory}
    rm -f ${tempDirectory}/*.bin
    rm -rf ${tempDirectory}/switch/KosmosUpdater
    cd ${tempDirectory} && zip -q -r ${resourceDirectory}/Kosmos.zip .

    # Remove temp file
    rm -f "/tmp/${releaseResponseFilename}"
    rm -f "/tmp/${downloadFilename}"
    rm -rf "${tempDirectory}"
    rm -f "${resourceDirectory}/UpdateKosmos"
}

update_kosmos_updater () {
    releaseResponseFilename=$(uuidgen)
    downloadFilename=$(uuidgen)

    curl -H "Accept: application/json" -H "Content-Type: application/json" -H "User-Agent: KosmosUpdaterServer/1.0.0" -s https://api.github.com/repos/AtlasNX/Kosmos-Updater/releases/latest >> /tmp/${releaseResponseFilename}
    if [ ! -f "/tmp/${releaseResponseFilename}" ] ;
    then
        return
    fi

    # Get latest version number
    version=$(jq -r '.tag_name' /tmp/${releaseResponseFilename})

    # Get latest app
    numberOfAssets=$(jq -r '.assets | length' /tmp/${releaseResponseFilename})
    for (( i=0; i<${numberOfAssets}; i++ ))
    do
        name=$(jq -r ".assets[${i}].name" /tmp/${releaseResponseFilename} | tr '[:upper:]' '[:lower:]')
        browserDownloadUrl=$(jq -r ".assets[${i}].browser_download_url" /tmp/${releaseResponseFilename})
        if [[ ${name} == *nro ]] ;
        then
            curl -L -H "User-Agent: KosmosUpdaterServer/1.0.0" -s ${browserDownloadUrl} >> /tmp/${downloadFilename}
            break
        fi
    done
    
    # No asset found or download failed
    if [ ! -f "/tmp/${downloadFilename}" ] ;
    then
        rm -f /tmp/${releaseResponseFilename}
        return
    fi

    # Remove old files
    rm -f "${resourceDirectory}/KosmosUpdaterVersion.txt"
    rm -f "${resourceDirectory}/KosmosUpdater.nro"
    
    # Move new files
    echo -n $version >> "${resourceDirectory}/KosmosUpdaterVersion.txt"
    mv "/tmp/${downloadFilename}" "${resourceDirectory}/KosmosUpdater.nro"

    # Remove temp file
    rm -f "/tmp/${releaseResponseFilename}"
    rm -f "${resourceDirectory}/UpdateKosmosUpdater"
}

if [ -f "${resourceDirectory}/UpdateKosmos" ] ;
then
    update_kosmos
fi

if [ -f "${resourceDirectory}/UpdateKosmosUpdater" ] ;
then
    update_kosmos_updater
fi
