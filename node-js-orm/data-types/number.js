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

        if (value === undefined
            || value === null
            ||
            (typeof value !== "string" && typeof value !== "number")
        ) return undefined;

        if (typeof value === "number"){
            return value;
        }

        return isNaN(parseFloat(value)) ? undefined : parseFloat(value);

    }


    /**
     * Chuyển đổi mệnh đề where thực sự giá trị của nó
     * ngoại trừ các mệnh đề {$like, $in, ...} thì bỏ qua không chuyển đổi dữ liệu
     * @param {*} value 
     * @param {*} dbType 
     */
    getTrueDataWhere(value, dbType) {
        
        if (value === undefined
            || value === null
        ) return undefined;

        if (typeof value === "number"){
            return value;
        }

        // nếu là mệnh đề where:{id:{$like:...}}  thì trả về nguyên gốc
        if (typeof value === "object"){
            return value;
        }
        // nếu không thì chuyển đổi giá trị từ chuỗi sang

        if (typeof value === "string"){
            return isNaN(parseFloat(value)) ? undefined : parseFloat(value);
        }

        return undefined;
        
    }
}
module.exports = new NUMBER()