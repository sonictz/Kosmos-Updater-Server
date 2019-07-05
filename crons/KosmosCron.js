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

const AdmZip = require('adm-zip')
const config = require('../config.json')
const FileSystemService = require('../services/FilesystemService')
const fs = require('fs')
const request = require('request')
const rmfr = require('rmfr')

module.exports = class KosmosCron {
    constructor() {
        this.name = 'UpdateKosmos'
    }

    async run() {
        try {
            const release = await this._getLatestRelease()
            await this._writeVersion(release.version)
            await this._download(release.downloadUrl)
            await this._modifyZipArchive()
            return true
        } catch (err) {
            console.error(`[${ this.name }] ${ err }`)
        }

        return false
    }

    _getLatestRelease() {
        return new Promise(async (resolve, reject) => {
            const options = {
                url: 'https://api.github.com/repos/AtlasNX/Kosmos/releases/latest',
                headers: {
                    'User-Agent': 'KosmosUpdaterServer/1.0.0'
                },
                json: true
            }

            request.get(options, (error, response, data) => {
                if (error) {
                    reject('HTTP Error - ' + err.message)
                }

                if (!data.assets || !Array.isArray(data.assets)) {
                    reject('No assets on release.')
                    return
                }

                const asset = data.assets.find((element) => {
                    return element.name.toLowerCase().startsWith('kosmos')
                })

                if (!asset) {
                    reject('Unable to find Kosmos.')
                    return
                } else if (!asset.browser_download_url) {
                    reject('No download URL for Kosmos.')
                    return
                }

                resolve({
                    version: data.tag_name,
                    downloadUrl: asset.browser_download_url
                })
            })
        })
    }

    _writeVersion(version) {
        return new Promise(async (resolve, reject) => {
            try {
                await FileSystemService.deleteFile(`${ config.resourceDirectory }/KosmosVersion.txt`)
            } catch (err) {
                reject('Unable to delete old version file.')
                return
            }

            fs.writeFile(`${ config.resourceDirectory }/KosmosVersion.txt`, version, (writeErr) => {
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

            request.get(options, (error, response, body) => {
                if (error) {
                    reject('HTTP Error - ' + error)
                    return
                }

                const tmpDir = `${ config.resourceDirectory }/tmp`
                const zip = new AdmZip(body)
                zip.extractAllTo(tmpDir)

                resolve()
            })
        })
    }

    _modifyZipArchive() {
        return new Promise(async (resolve, reject) => {
            const tmpDir = `${ config.resourceDirectory }/tmp`

            await rmfr(`${ tmpDir }/switch/KosmosUpdater`)

            fs.readdir(tmpDir, async (err, items) => {
                if (err) {
                    return
                }

                for (var i = 0; i < items.length; i++) {
                    const item = items[i]
                    if (item.toLowerCase().startsWith('hekate') && item.toLowerCase().endsWith('bin')) {
                        await rmfr(`${ tmpDir }/${ item }`)
                    }
                }

                const zip = new AdmZip()
                zip.addLocalFolder(`${ tmpDir }/`)
                zip.writeZip(`${ config.resourceDirectory }/Kosmos.zip`)

                await rmfr(tmpDir)

                resolve()
            })
        })
    }
}
