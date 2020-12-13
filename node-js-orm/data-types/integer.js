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
        if (value === undefined
            || value === null
            ||
            (typeof value !== "string" && typeof value !== "number")
        ) return undefined;

        if (typeof value === "number") {
            return value;
        }

        if (typeof value === "string") {
            return isNaN(parseInt(value)) ? undefined : parseInt(value);
        }

        return undefined;

    }

    /**
     * Chuyển đổi mệnh đề where
     * @param {*} value 
     * @param {*} dbType 
     */
    getTrueDataWhere(value, dbType) {

        if (value === undefined
            || value === null
        ) return undefined;

        // nếu là mệnh đề where:{id:{$like:...}}  thì trả về nguyên gốc
        if (typeof value === "object") {
            return value;
        }
        
        if (typeof value === "number") {
            return value;
        }


        if (typeof value === "string") {
            return isNaN(parseInt(value)) ? undefined : parseInt(value);
        }

        return undefined;

    }
}
module.exports = new INTEGER()