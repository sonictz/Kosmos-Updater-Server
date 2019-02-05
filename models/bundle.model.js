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

const mongoose = require('mongoose')

const Schema = mongoose.Schema

let BundleSchema = new Schema({
    name: { type: String, required: true, max: 15 },
    modules: { type: [String], required: true, default: [] },
    payloadModule: { type: String, required: true },
    order: { type: Number, required: true, default: 999 }
})

module.exports = mongoose.model('Bundle', BundleSchema)
