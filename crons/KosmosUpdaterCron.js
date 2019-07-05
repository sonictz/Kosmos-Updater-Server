// Kosmos Updater Server
// Copyright (C) 2019 Steven Mattera
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

const config = require('../config.json')
const FileSystemService = require('../services/FilesystemService')
const fs = require('fs')
const request = require('request-promise-native')

module.exports = class KosmosUpdaterCron {
    constructor() {
        this.name = 'UpdateKosmosUpdater'
    }

    async run() {
        try {
            const release = await this._getLatestRelease()
            await this._writeVersion(release.version)
            await this._download(release.downloadUrl)
            return true
        } catch (err) {
            console.error(`[${ this.name }] ${ err }`)
        }

        return false
    }

    _getLatestRelease() {
        return new Promise(async (resolve, reject) => {
            const options = {
                url: 'https://api.github.com/repos/AtlasNX/Kosmos-Updater/releases/latest',
                headers: {
                    'User-Agent': 'KosmosUpdaterServer/1.0.0'
                },
                json: true
            }

            try {
                const data = await request.get(options)
                if (!data.assets || !Array.isArray(data.assets)) {
                    reject('No assets on release.')
                    return
                }

                const asset = data.assets.find((element) => {
                    return element.name.endsWith('.nro')
                })

                if (!asset) {
                    reject('Unable to find executable.')
                    return
                } else if (!asset.browser_download_url) {
                    reject('No download URL for asset.')
                    return
                }

                resolve({
                    version: data.tag_name,
                    downloadUrl: asset.browser_download_url
                })
            } catch (err) {
                reject('HTTP Error - ' + err.message)
            }
        })
    }

    _writeVersion(version) {
        return new Promise(async (resolve, reject) => {
            try {
                await FileSystemService.deleteFile(`${ config.resourceDirectory }/KosmosUpdaterVersion.txt`)
            } catch (err) {
                reject('Unable to delete old version file.')
                return
            }

            fs.writeFile(`${ config.resourceDirectory }/KosmosUpdaterVersion.txt`, version, (writeErr) => {
                if (writeErr) {
                    reject('Unable to write version file.')
                    return
                }

                resolve()
            })
        })
    }

    _download(url) {
        return new Promise(async (resolve, reject) => {
            const options = {
                url,
                headers: {
                    'User-Agent': 'KosmosUpdaterServer/1.0.0'
                },
                followRedirect: true,
                encoding: null
            }

            try {
                const data = await request.get(options)

                await FileSystemService.deleteFile(`${ config.resourceDirectory }/KosmosUpdater.nro`)

                const stream = fs.createWriteStream(`${ config.resourceDirectory }/KosmosUpdater.nro`)
                stream.write(data)
                stream.end()

                resolve()
            } catch (err) {
                reject('HTTP Error - ' + err.message)
            }
        })
    }
}
