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

module.exports = class PingController {
    constructor() {
        this.serverHeader = 'SDFU/4.0'

        this.getPing = this.getPing.bind(this)
    }

    getPing(req, res) {
        const hrTime = process.hrtime()

        res.status(200)
        res.send(`Pong - ${ hrTime[0] * 1000000000 + hrTime[1] }`)
    }
}
