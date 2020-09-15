const DataType = require("./data-type")
/**
 * là DATETIME cho phép lưu dạng chuỗi có cả thời gian không phải ngày
 */
class DATETIME extends DataType {
    constructor() {
        super({
            js: DataType.mapType().DATETIME[0],
            sqlite: DataType.mapType().DATETIME[1],
            oracle: DataType.mapType().DATETIME[2],
            mongodb: DataType.mapType().DATETIME[3]
        })
    }

    /**
    * Hàm tự chuyển đổi thực tế giá trị các kiểu dữ liệu tương ứng
    * giá trị value đầu vào là kiểu string hoặc number hoặc boolean
    * sau đó chuyển đổi sang kiểu ngày tương thích với csdl khác nhau
    * ví dụ: kiểu DATE: value=`2020-08-01` =>js=Date(`2020-08-01`) => sqlite=`2020-08-01` 
    * => oracle = `__$to_date('01/01/2019','dd/mm/yyyy')` (chuyển chuỗi hàm của oracle trong đối tượng DAO thực hiện)
    * @param {*} value 
    * @param {*} dbType 
    */
    getTrueData(value, dbType) {
        let customeDate = new Date(value);
        if (dbType === DataType.mapType().dbTypes[0]) return customeDate
        let yyyy_mm_dd = ("" + customeDate.getFullYear()).padStart(4, 0) + "-" + ("" + (customeDate.getMonth() + 1)).padStart(2, 0) + "-" + ("" + customeDate.getDate()).padStart(2, 0)
        let hh_mi_ss = ("" + customeDate.getHours()).padStart(2, 0) + ":" + ("" + customeDate.getMinutes()).padStart(2, 0) + ":" + ("" + customeDate.getSeconds()).padStart(2, 0)
        if (dbType === DataType.mapType().dbTypes[1]) return `${yyyy_mm_dd} ${hh_mi_ss}`;
        if (dbType === DataType.mapType().dbTypes[2]) return `__$to_date('${yyyy_mm_dd} ${hh_mi_ss}','yyyy-mm-dd hh24:mi:ss')`
        if (dbType === DataType.mapType().dbTypes[3]) return `${yyyy_mm_dd} ${hh_mi_ss}`;
        return `${yyyy_mm_dd} ${hh_mi_ss}`
    }
}
module.exports = new DATETIME()