const DataType = require("./data-type")
/**
 * là DATE cho phép lưu dạng text chuyển sang Date, sang to_date, sang text iso = 2020-08-26
 */
class DATE extends DataType {
    constructor() {
        super({
            js: DataType.mapType().DATE[0],
            sqlite: DataType.mapType().DATE[1],
            oracle: DataType.mapType().DATE[2],
            mongodb: DataType.mapType().DATE[3]
        })
    }

    /**
    * Hàm tự chuyển đổi thực tế giá trị các kiểu dữ liệu tương ứng
    * giá trị value đầu vào là kiểu string hoặc number hoặc boolean
    * sau đó chuyển đổi sang kiểu ngày tương thích với csdl khác nhau
    * ví dụ: kiểu DATE: value=`2020-08-01` =>js=Date(`2020-08-01`) => sqlite=`2020-08-01` 
    * => oracle = `__$to_date('01/01/2019','dd/mm/yyyy')` (chuyển chuỗi hàm của oracle trong đối tượng DAO thực hiện)
    * @param {*} value 'yyyy-mm-dd`
    * @param {*} dbType 
    */
    getTrueData(value, dbType) {
        
        if (!value) {
            return undefined;
        }

        let customeDate = new Date(value);
        if (dbType === DataType.mapType().dbTypes[0]) return customeDate
        let yyyy_mm_dd = ("" + customeDate.getFullYear()).padStart(4, 0) + "-" + ("" + (customeDate.getMonth() + 1)).padStart(2, 0) + "-" + ("" + customeDate.getDate()).padStart(2, 0)
        // let hh_mi_ss = ("" + customeDate.getHours()).padStart(2, 0) + ":" + ("" + customeDate.getMinutes()).padStart(2, 0) + ":" + ("" + customeDate.getSeconds()).padStart(2, 0)
        if (dbType === DataType.mapType().dbTypes[1]) return yyyy_mm_dd;
        if (dbType === DataType.mapType().dbTypes[2]) return `__$to_date('${yyyy_mm_dd}','yyyy-mm-dd')`
        if (dbType === DataType.mapType().dbTypes[3]) return yyyy_mm_dd
        return yyyy_mm_dd
    }
}
module.exports = new DATE()