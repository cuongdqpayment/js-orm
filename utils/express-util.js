const express = require('express')
module.exports = {
    express
    , app: express()
    , fs: require('fs')
    , path: require('path')
    , os: require('os')
    , CorsHandler: require('./express-handlers/cors-handler')
    , errors: require('./express-handlers/error-handler').errors
}