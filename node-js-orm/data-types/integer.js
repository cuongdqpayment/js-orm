const DataType = require("./data-type")
/**
 * là số nguyên như integer
 */
class INTEGER extends DataType {
    constructor() {
        super({
            js: DataType.mapType().INTEGER[0],
            sqlite: DataType.mapType().INTEGER[1],
            oracle: DataType.mapType().INTEGER[2],
            mongodb: DataType.mapType().INTEGER[3]
        })
    }
    /**
     * Chuyển đổi dữ liệu thật trong mongo từ text sang số
     * @param {*} value 
     * @param {*} dbType 
     */
    getTrueData(value, dbType) {
        return parseInt(value)
    }
}
module.exports = new INTEGER()