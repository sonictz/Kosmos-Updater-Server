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
const V4Controller = require('../controllers/v4.controller')

const router = express.Router()
const controller = new V4Controller();

router.get('/app', controller.getApp)
router.get('/app/version-number', controller.getAppVersionNumber)
router.get('/package', controller.getPackage)
router.get('/package/version-number', controller.getPackageVersionNumber)

module.exports = router
