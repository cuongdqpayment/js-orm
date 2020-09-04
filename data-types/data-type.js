/**
 * Bổ sung 1 kiểu dl là tạo tên, tạo class trùng với tên
 */

class DataType {

    static mapType = {
        dbTypes: ["js", "sqlite", "oracle", "mongodb"]
        , STRING: ["string", "TEXT", "VARCHAR2(2000)", "string"]
        , NUMBER: ["number", "NUMBERIC", "NUMBER", "number"]
        , INTEGER: ["number", "INTEGER", "NUMBER", "number"]
        , BOOLEAN: ["boolean", "INTEGER", "NUMBER", "number"]
        , DATE: ["string", "TEXT", "DATE", "string"]
        , DATETIME: ["string", "TEXT", "DATE", "string"]
        , TIMESTAMP: ["number", "INTEGER", "NUMBER", "number"]
    }

    constructor(types) {
        this.types = types
    }
    /**
     * Hàm chuyển đổi kiểu dữ liệu để tương thích với các csdl với dữ liệu trung gian là mô hình
     * ví dụ: js=string, thì sqlite=TEXT, oracle=VARCHAR2(2000)
     * @param {*} dbType kiểu csdl = sqlite | oracle | mongodb
     * @param {*} length đội dài khởi tạo như varchar2(100)
     */
    getRealType(dbType, length) {
        let newType = this.types[dbType] || "string"
        return length ? newType.replace(/([\[(])(.+?)([\])])/g, (match, p1, p2, p3, offset, string) => p1 + length + p3) : newType;
    }

    /**
     * Hàm kiểm tra tính hợp lệ của dữ liệu đưa vào trước khi chèn hoặc update có phù hợp với định nghĩa mô hình trước đó hay không
     * nếu không thì sẽ ném ra lỗi không đúng dạng dữ liệu hoặc độ dài không thích hợp
     * @param {*} value 
     * @param {*} opts 
     */
    isValid(value, opts) {
        // console.log("Validate", typeof value, this.types.js, opts, isNaN(value));
        if (typeof value !== this.types.js
            && (
                (this.types.js !== "number" && this.types.js !== "string")
                // kiểu số mà đưa vào chuỗi không đổi được số thì đưa ra lỗi
                || (this.types.js === "number" && isNaN(value))
                // kiểu chuỗi mà đưa vào không phải số cũng không phải chuỗi thì lỗi
                || (this.types.js === "string" && typeof value !== "number")
            )
        )
            throw `${value} IS NOT ${this.types.js}`
        if (opts && opts.length && value && value.length > opts.length)
            throw `${value} WITH LENGTH ${value.length}>${opts.length}`
        return true;
    }
}
module.exports = DataType