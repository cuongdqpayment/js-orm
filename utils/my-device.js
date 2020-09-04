const os = require('os');
let addresses = [];
// Network interfaces
var ifaces = os.networkInterfaces();
let ifnames = Object.keys(ifaces);
for (let ifname of ifnames) {
    var alias = 0;
    ifaces[ifname].forEach(function (iface) {
        if (iface.internal !== false) {
            // các giao tiếp bên trong để loop back thôi
            return;
        }
        // console.log(`${ifname} ${iface.family} ${iface.address}`);
        addresses.push(`${ifname} ${iface.family} ${iface.address}`)
        ++alias;
    });
}

// console.log('addresses',addresses);
module.exports = {
    os: `${os.platform()}|${os.release()}|${os.arch()}`
    , ips: addresses.toString()
}