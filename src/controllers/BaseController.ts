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
import Method from '../types/Method'
import IRoute from '../types/Route'

class BaseController {
    public router: express.Router
    protected path: string

    constructor() {
        this.router = express.Router()
    }

    protected initRoutes(routes: IRoute[]) {
        routes.forEach((route) => {
            switch (route.method) {
                case Method.DELETE:
                    this.router.delete(`${this.path}${route.path}`, route.callback)
                    break

                case Method.GET:
                    this.router.get(`${this.path}${route.path}`, route.callback)
                    break

                case Method.PATCH:
                    this.router.patch(`${this.path}${route.path}`, route.callback)
                    break

                case Method.POST:
                    this.router.post(`${this.path}${route.path}`, route.callback)
                    break

                case Method.PUT:
                    this.router.put(`${this.path}${route.path}`, route.callback)
                    break
            }
        })
    }
}

export default BaseController
