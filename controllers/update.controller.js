// SDFile Updater Server
// Copyright (C) 2018 Steven Mattera
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

const crypto = require('crypto')
const config = require('../config.json')

module.exports.getUpdate = (req, res) => {
    const userAgent = req.headers['user-agent']
    if (userAgent === undefined || !userAgent.startsWith('GitHub-Hookshot/')) {
        res.status(401)
        res.send('Unauthorized - Incorrect User Agent')
        return
    }

    const hmac = crypto.createHmac('sha1', config.secret)
    hmac.update(JSON.stringify(req.body))

    const signature = req.headers['x-hub-signature']
    const calculatedSignature = `sha1=${ hmac.digest('hex') }`
    if (signature !== calculatedSignature) {
        res.status(401)
        res.send('Unauthorized - Incorrect Secret Key')
        return
    }

    const event = req.headers['x-github-event']
    if (event === 'release') {
        res.status(200)
        res.send('Updated stable files.')

        // TODO: 🔥 Update in MongoDB as ready to pull.
    } else if (event === 'push') {
        res.status(200)
        res.send('Updated bleeding-edge files.')

        // TODO: 🔥 Update in MongoDB as ready to pull.
    } else {
        res.status(202)
        res.send(`Unable to handle event "${ event }".`)
    }
}
