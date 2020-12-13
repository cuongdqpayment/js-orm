
const DataType = require("./data-type")
/**
 * là chuỗi string (có độ dài hữu hạn)
 */
class STRING extends DataType {
    constructor() {
        super({
            js: DataType.mapType().STRING[0],
            sqlite: DataType.mapType().STRING[1],
            oracle: DataType.mapType().STRING[2],
            mongodb: DataType.mapType().STRING[3]
        })
    }

    /**
     * Chuyển đổi dữ liệu sang string nếu nó là dạng object hoặc dạng số
     * @param {*} value 
     * @param {*} dbType 
     */
    getTrueData(value, dbType) {
        if (value === undefined || value === null) return undefined;
        
        if (typeof value === "object") {
            return JSON.stringify(value);
        }

        if (typeof value === "number") {
            return "" + value;
        }

        if (typeof value !== "string") {
            return undefined;
        }

        return value;
    }


    /**
     * Mệnh đề where
     * @param {*} value 
     * @param {*} dbType 
     */
    getTrueDataWhere(value, dbType) {

        if (value === undefined || value === null) return undefined;

        // nếu là mệnh đề where:{id:{$like:...}}  thì trả về nguyên gốc
        if (typeof value === "object") {
            return value;
        }

        if (typeof value === "number") {
            return "" + value;
        }

        if (typeof value !== "string") {
            return undefined;
        }
        
        return value;
    }

}
module.exports = new STRING()