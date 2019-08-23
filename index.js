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

const express = require('express')
const bodyParser = require('body-parser')
const config = require('./config.json')
const ping = require('./routes/ping.route')
const update = require('./routes/update.route')
const v3 = require('./routes/v3.route')
const v4 = require('./routes/v4.route')

// Setup Express
const app = express()
app.use(bodyParser.json())
app.set('etag', false)

// Remove express header and prevent caching
app.use((req, res, next) => {
    res.removeHeader('X-Powered-By')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    next()
})

// Validate user-agent.
app.use((req, res, next) => {
    const userAgent = req.headers['user-agent']
    const path = req.path

    if ((userAgent && path.startsWith('/update') && userAgent.startsWith('GitHub-Hookshot/')) || (userAgent && !path.startsWith('/update') && userAgent.startsWith('kosmos-updater/')) || path.startsWith('/ping')) {
        next()
        return
    }

    res.status(401)
    res.send('Unauthorized - Incorrect User Agent')
})

// Routes
app.use(ping)
app.use(update)
app.use('/v3', v3)
app.use('/v4', v4)

app.listen(config.portNumber, () => {
    console.log(`Server is listening on ${ config.portNumber }`)
})
