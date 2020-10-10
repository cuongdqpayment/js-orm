const DataType = require("./data-type")
/**
 * Là số thực, như double, real
 */
class NUMBER extends DataType {
    constructor() {
        super({
            js: DataType.mapType().NUMBER[0],
            sqlite: DataType.mapType().NUMBER[1],
            oracle: DataType.mapType().NUMBER[2],
            mongodb: DataType.mapType().NUMBER[3]
        })
    }
    /**
     * Chuyển đổi dữ liệu sang float nếu nó là string
     * @param {*} value 
     * @param {*} dbType 
     */
    getTrueData(value, dbType) {
        return parseFloat(value)
    }
}
module.exports = new NUMBER()