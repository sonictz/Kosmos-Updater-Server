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
import Config from '../config.json'
import FileSystemService from '../services/FileSystemService.js'
import GitHubService from '../services/GitHubService.js'
import Method from '../types/Method'
import BaseController from './BaseController'

class UpdateController extends BaseController {
    constructor() {
        super()
        this.path = '/update'
        this.initRoutes([
            {
                callback: this.postKosmosUpdate.bind(this),
                method: Method.POST,
                path: '',
            },
            {
                callback: this.postKosmosUpdaterUpdate.bind(this),
                method: Method.POST,
                path: '/app',
            },
        ])
    }

    private async postKosmosUpdate(req: express.Request, res: express.Response) {
        try {
            const valid = GitHubService.verifyMessageFromGitHub(
                req.body,
                req.headers['x-hub-signature'] as string,
                Config.secret,
                req.headers['x-github-event'] as string,
            )

            if (valid) {
                await FileSystemService.createFile(`${ Config.resourceDirectory }/UpdateKosmos`)
                res.sendStatus(200)
            } else {
                res.sendStatus(202)
            }
        } catch (e) {
            if (e.message.startsWith('Unauthorized')) {
                res.sendStatus(401)
            } else {
                console.error(`[Error] - postKosmosUpdate - ${e.name}: ${e.message}`)
                res.sendStatus(500)
            }
        }
    }

    private async postKosmosUpdaterUpdate(req: express.Request, res: express.Response) {
        try {
            const valid = GitHubService.verifyMessageFromGitHub(
                req.body,
                req.headers['x-hub-signature'] as string,
                Config.secret,
                req.headers['x-github-event'] as string,
            )

            if (valid) {
                await FileSystemService.createFile(`${ Config.resourceDirectory }/UpdateKosmosUpdater`)
                res.sendStatus(200)
            } else {
                res.sendStatus(202)
            }
        } catch (e) {
            if (e.startsWith('Unauthorized')) {
                res.sendStatus(401)
            } else {
                console.error(`[Error] - postKosmosUpdaterUpdate - ${e.name}: ${e.message}`)
                res.sendStatus(500)
            }
        }
    }
}

export default UpdateController
