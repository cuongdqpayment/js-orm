const DataType = require("./data-type")
/**
 * là kiểu logic như kiểu đúng = YES, TRUE, ON sai = NO, FALSE, OFF
 */
class BOOLEAN extends DataType {
    constructor() {
        super({
            js: DataType.mapType.BOOLEAN[0],
            sqlite: DataType.mapType.BOOLEAN[1],
            oracle: DataType.mapType.BOOLEAN[2],
            mongodb: DataType.mapType.BOOLEAN[3]
        })
    }

    /**
    * Tự chuyển true = 1 và false hoặc còn lại là 0
    * @param {*} value 
    * @param {*} dbType 
    */
    getTrueData(value, dbType) {
        return value ? 1 : 0
    }
}
module.exports = new BOOLEAN()