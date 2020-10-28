
// định nghĩa chuyển csdl
const Model = require("./model");
const json2Model = require("./json-2-model");
const excell2Database = require("./excel-2-database");

// Định nghĩa khai báo một mô hình với csdl bằng mở rộng lớp mô hình từ thư viện và gọi lại thư viện
class DynamicModel extends Model {
    /**
     * 
     * @param {*} db kết nối csdl theo mô hình model
     * @param {*} table_name tên bảng - trùng với mô hình json text cho model
     * @param {*} jsonTextModel - cấu hình orm text - 
     */
    constructor(db, table_name, jsonTextModel) {
        // thực hiện khởi tạo mô hình lớp trên
        super(db, table_name, json2Model.jsonText2Model(jsonTextModel));
        // giao tiếp csdl Database theo mô hình (không phụ thuộc loại csdl)
        this.dbModel = db;
        // csdl DAO nguyên thủy sử dụng như các phương thức cũ (phải biết rõ đang sử dụng loại csdl nào để sử dụng lệnh phù hợp)
        this.dbDAO = db.getDbInstance();
    }

    // Danh sách các hàm mặt định của mô hình thuộc đối tượng Model gồm:
    /*
    - this.sync() = tạo bảng trong csdl
    - this.getStructure() = trả về cấu trúc thực của mô hình
    - this.getName() = trả về tên bảng của mô hình
    - this.getDb() = trả về csdl của mô hình đang kết nối (đối tượng database)
    - this.create() = insert - C
    - this.read()   = select - R
    - this.update() = update - U
    - this.delete() = delete - D
    - this.readCount() trả về số lượng bảng ghi của bảng theo mệnh đề where
    - this.readPage() = tương đương getPage()
    - this.readAll() = select * or all from ... 
     */

    //... Viết các phương thức riêng của mô hình ở đây
    /*
    * Hướng dẫn nhập liệu các mệnh đề where (clause): 
    * 
    * $lt <, nhỏ hơn
    * $lte <=, nhỏ hơn hoặc bằng
    * $gt >, lớn hơn
    * $gte >=, lớn hơn hoặc bằng
    * $ne !=, không bằng
    * $in [], nằm trong tập
    * $nin [], không nằm trong tập
    * $like [], giống với *x* = %x%
    * $null true/false, is null
    * $exists true/false is not null
    * 
    * @param {*} jsonFields {field_name_1: 1 | 0, ...} for list field 
    * @param {*} jsonSort = {field_name: 1 | -1} 1 for sort asc or -1 for sort desc
    * @param {*} jsonPage = {page, total, limit}
    */

    /**
     * Đếm số lượng bảng ghi sử dụng để phân trang tìm kiếm sau này
     * @param {*} jsonWhere 
     */
    getCount(jsonWhere = {}) {
        return this.readCount(jsonWhere);
    }

    /**
     * Truy vấn theo trang dữ liệu {page, total, limit}
     * @param {*} jsonWhere {field_name:value | {$whereOperator:value},...}  or object of where clause
     * 
     * Trả về {page, data:[]}
     */
    getPage(jsonWhere = {}, jsonFields, jsonSort, jsonPage) {
        return this.readPage(jsonWhere, jsonFields, jsonSort, jsonPage);
    }

    // phương thức đầu tiên là truy vấn toàn bộ dữ liệu có trong bảng
    /*
    // mệnh đề where được khai báo là key = tên cột, value bằng giá trị của mệnh đề where
    // nếu để trống thì tương đương select * from table;
    {},
    // khai báo liệt kê các cột dữ liệu cần hiển thị ở đây với key là tên trường và, giá trị là 1,
    ,{ id: 1,...}
     // mệnh đề sort fix from node-js-orm-1.1.3 trở lên
     // khai báo muốn sắp xếp cột nào, theo trật tự lớn đến bé = 1 hoặc bé đến lớn = -1
    ,{ id: -1 } 
    // mệnh đề phân trang, và giới hạn
    , {limit: 10, offset: 0}
    */
    getAllData(jsonWhere = {}, jsonFields, jsonSort, jsonPaging) {
        return this.readAll(jsonWhere, jsonFields, jsonSort, jsonPaging);
    }

    /**
     * Lấy 1 bảng ghi đầu tiên tìm thấy được theo mệnh đề where...
     * nếu ta đưa sắp xếp vào thì sẽ lấp bảng ghi đầu tiên
     * 
     */
    getFirstRecord(jsonWhere = {}, jsonFields, jsonSort) {
        return this.read(jsonWhere, jsonFields, jsonSort);
    }

    /**
     * Chèn một bản ghi
     * @param {*} jsonData 
     */
    insertOneRecord(jsonData) {
        return this.create(jsonData);
    }


    /**
     * Import một danh sách dữ liệu vào csdl
     * @param {*} jsonRows 
     */
    importRows(jsonRows = [], GROUP_COUNT = 100, isDebug = false) {

        if (!jsonRows 
            || !Array.isArray(jsonRows) 
            || jsonRows.filter(x => Object.keys(x).length > 0).length === 0) {
            return Promise.reject("No data for import");
        }

        return excell2Database.importArray2Database(
            this,
            jsonRows.filter((x) => Object.keys(x).length > 0),
            GROUP_COUNT
            , isDebug
        );
        
    }

    /**
     * Cập nhập một bảng ghi đầu tiên
     * @param {*} jsonData 
     * @param {*} jsonWhere 
     */
    updateOneRecord(jsonData, jsonWhere) {
        return this.update(jsonData, jsonWhere);
    }

    /**
     * Cập nhập tất cả các bảng ghi theo mệnh đề where
     * @param {*} jsonData 
     * @param {*} jsonWhere 
     */
    updateAll(jsonData, jsonWhere) {
        return this.updates(jsonData, jsonWhere);
    }

    /**
     * Xóa 1 bản ghi đầu tiên tìm thấy được
     * @param {*} jsonWhere 
     */
    deleteOneRecord(jsonWhere) {
        return this.delete(jsonWhere);
    }

    /**
     * Xóa tất cả các bảng ghi tìm thấy theo mệnh đề where
     * @param {*} jsonWhere 
     */
    deleteAll(jsonWhere) {
        return this.deletes(jsonWhere);
    }

    // ... Bạn có thể chèn vào các phương thức, hàm riêng để thao tác với cơ sở dữ liệu, để trả kết quả cho người dùng
    // ... xem thêm thư viện https://www.npmjs.com/package/node-js-orm hoặc vào thư viện gốc được cài đặt trên ./node-module để biết thêm các hàm giao tiếp khác

}

module.exports = DynamicModel;