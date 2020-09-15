const DataType = require("./data-type")
/**
 * là TIMESTAMP cho phép lưu dạng số milisecond
 * Date.now()
 */
class TIMESTAMP extends DataType {
    constructor() {
        super({
            js: DataType.mapType().TIMESTAMP[0],
            sqlite: DataType.mapType().TIMESTAMP[1],
            oracle: DataType.mapType().TIMESTAMP[2],
            mongodb: DataType.mapType().TIMESTAMP[3]
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
        if (dbType === DataType.mapType().dbTypes[1]) return customeDate.getTime();
        return customeDate.getTime();
    }
}
module.exports = new TIMESTAMP()