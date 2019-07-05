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

const config = require('./config.json')
const fs = require('fs')

const KosmosCron = require('./crons/KosmosCron')
const KosmosUpdaterCron = require('./crons/KosmosUpdaterCron')
const FileSystemService = require('./services/FilesystemService')

class CronManager {
    constructor() {
        this.crons = [
            new KosmosCron(),
            new KosmosUpdaterCron()
        ]
    }

    run() {
        this.crons.forEach(async (cron) => {
            try {
                if (await FileSystemService.fileExists(`${ config.resourceDirectory }/${ cron.name }`) && await cron.run()) {
                    await FileSystemService.deleteFile(`${ config.resourceDirectory }/${ cron.name }`)
                }
            } catch (err) {
                console.error(`[${ this.name }] ${ err }`)
            }
        })
    }
}

let cronManager = new CronManager()
cronManager.run()
