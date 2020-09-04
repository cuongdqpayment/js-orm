
const DataType = require("./data-type")
/**
 * là chuỗi string (có độ dài hữu hạn)
 */
class STRING extends DataType {
    constructor() {
        super({
            js: DataType.mapType.STRING[0],
            sqlite: DataType.mapType.STRING[1],
            oracle: DataType.mapType.STRING[2],
            mongodb: DataType.mapType.STRING[3]
        })
    }
}
module.exports = new STRING()