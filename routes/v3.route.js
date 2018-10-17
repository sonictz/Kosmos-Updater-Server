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

const express = require('express')
const v3_controller = require('../controllers/v3.controller')

const router = express.Router()

router.get('/app', v3_controller.getApp)
router.get('/app/version-number', v3_controller.getAppVersionNumber)
router.get('/package', v3_controller.getPackage)
router.get('/package/version-number', v3_controller.getPackageVersionNumber)

module.exports = router
