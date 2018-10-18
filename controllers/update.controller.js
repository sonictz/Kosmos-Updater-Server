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
const Cron = require('../models/cron.model')
const config = require('../config.json')

module.exports.postUpdate = (req, res) => {
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
        Cron.findOne({ channel: 'stable' }, (err, cron) => {
            if (err || cron === null) {
                cron = new Cron({
                    channel: 'stable',
                    shouldRun: true
                })

                cron.save((err) => {
                    if (err) {
                        res.status(500)
                        res.send('Unable to queue update to stable files.')
                        return
                    }
                    
                    res.status(200)
                    res.send('Queued update to stable files.')            
                })    
            } else {
                Cron.findByIdAndUpdate(cron._id, { $set: { shouldRun: true }}, (err) => {
                    if (err) {
                        res.status(500)
                        res.send('Unable to queue update to stable files.')
                        return
                    }

                    res.status(200)
                    res.send('Queued update to stable files.')            
                })
            }
        })
    } else if (event === 'push') {
        Cron.findOne({ channel: 'bleeding-edge' }, (err, cron) => {
            if (err || cron === null) {
                cron = new Cron({
                    channel: 'bleeding-edge',
                    shouldRun: true
                })

                cron.save((err) => {
                    if (err) {
                        res.status(500)
                        res.send('Unable to queue update to bleeding-edge files.')
                        return
                    }
                    
                    res.status(200)
                    res.send('Queued update to bleeding-edge files.')            
                })    
            } else {
                Cron.findOneAndUpdate({ _id: cron._id }, { $set: { shouldRun: true }}, (err) => {
                    if (err) {
                        res.status(500)
                        res.send('Unable to queue update to bleeding-edge files.')
                        return
                    }

                    res.status(200)
                    res.send('Queued update to bleeding-edge files.')            
                })
            }
        })
    } else {
        res.status(202)
        res.send(`Unable to handle event "${ event }".`)
    }
}
