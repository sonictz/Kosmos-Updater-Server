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

const fs = require('fs')
const config = require('../config.json')

module.exports = class V4Controller {
    constructor() {
        this.serverHeader = 'SDFU/4.0'

        this.getApp = this.getApp.bind(this)
        this.getAppVersionNumber = this.getAppVersionNumber.bind(this)
        this.getPackage = this.getPackage.bind(this)
        this.getPackageVersionNumber = this.getPackageVersionNumber.bind(this)
    }

    getApp(req, res) {
        const path = `${ config.resourceDirectory }/KosmosUpdater.nro`
        const stat = fs.statSync(path)

        res.status(200)
        res.setHeader('Server', this.serverHeader)
        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Content-Length', stat.size)
        res.setHeader('Content-Disposition', `attachment; filename="KosmosUpdater.nro"`)

        fs.createReadStream(pkg.path).pipe(res)
    }

    async getAppVersionNumber(req, res) {
        const version = await this._getContentOfFile(`${ config.resourceDirectory }/KosmosUpdaterVersion.txt`);

        res.status(200)
        res.setHeader('Server', this.serverHeader)
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Length', version.length)
        res.send(version)
    }

    async getPackage(req, res) {
        const path = `${ config.resourceDirectory }/Kosmos.zip`
        const stat = fs.statSync(path)
        const version = await this._getContentOfFile(`${ config.resourceDirectory }/KosmosVersion.txt`);

        res.status(200)
        res.setHeader('Server', this.serverHeader)
        res.setHeader('Content-Type', `application/zip`)
        res.setHeader('Content-Length', stat.size)
        res.setHeader('Content-Disposition', `attachment; filename="Kosmos.zip"`)
        res.setHeader('X-Version-Number', version)

        fs.createReadStream(pkg.path).pipe(res)
    }

    async getPackageVersionNumber(req, res) {
        const version = await this._getContentOfFile(`${ config.resourceDirectory }/KosmosVersion.txt`);

        res.status(200)
        res.setHeader('Server', this.serverHeader)
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Length', version.length)
        res.send(version)
    }

    _getContentOfFile(file) {
        return new Promise((resolve, reject) => {
            fs.readFile(file, function(err, buf) {
                if (err) {
                    reject(err)
                    return
                }

                resolve(buf.toString())
            })
        })
    }
}
