// Kosmos Updater Server
// Copyright (C) 2019 Nichole Mattera
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

import express from 'express'
import fs from 'fs'
import Config from '../config.json'
import FileSystemService from '../services/FileSystemService.js'
import Method from '../types/Method'
import BaseController from './BaseController'

class PackageController extends BaseController {
    constructor() {
        super()
        this.path = '/:version/package'
        this.initRoutes([
            {
                callback: this.getPackage.bind(this),
                method: Method.GET,
                path: '',
            },
            {
                callback: this.getPackageVersionNumber.bind(this),
                method: Method.GET,
                path: '/version-number',
            },
        ])
    }

    private async getPackage(req: express.Request, res: express.Response) {
        const version = this.parseAPIVersion(req.params.version)
        if (isNaN(version)) {
            res.sendStatus(404)
            return
        }

        const location = `${ Config.resourceDirectory }/Kosmos.zip`
        const fileSize = await FileSystemService.getFileSize(location)
        if (fileSize === 0) {
            console.error('[Error] - getPackage - File Size is Zero.')
            res.sendStatus(500)
            return
        }

        res.status(200)
        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Content-Length', fileSize)
        res.setHeader('Content-Disposition', 'attachment; filename="Kosmos.zip"')
        fs.createReadStream(location).pipe(res)
    }

    private async getPackageVersionNumber(req: express.Request, res: express.Response) {
        const version = this.parseAPIVersion(req.params.version)
        if (isNaN(version)) {
            res.sendStatus(404)
            return
        }

        const location = `${ Config.resourceDirectory }/KosmosVersion.txt`
        try {
            const content = await FileSystemService.getContents(location)

            res.status(200)
            res.setHeader('Content-Type', 'text/plain')
            res.setHeader('Content-Length', content.length)
            res.send(content)
        } catch {
            console.error('[Error] - getPackageVersionNumber - Missing Content.')
            res.sendStatus(500)
            return
        }
    }

    private parseAPIVersion(version: string): number {
        if (!version.startsWith('v')) {
            return NaN
        }

        const versionNumber = parseInt(version.substr(1), 10)
        if (versionNumber !== 4) {
            return NaN
        }

        return versionNumber
    }
}

export default PackageController
