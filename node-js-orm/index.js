module.exports = {
    Model: require("./model"),                // đây là một class Model có thể khai cho mô hình đơn lẻ kiểu cũ
    database: require("./database"),    // đối tượng csdl để giao tiếp chung
    DataTypes: require("./data-types"),  // các kiểu cơ sở dữ liệu của mô hình
    excell2Database: require("./excel-2-database"), // chuyển đổi file excel, table, array, sang các model, jsonText...
    json2Model: require("./json-2-model"),          // chuyển đổi array sang jsonText và từ jsonText sang jsonModel - kiểu dữ liệu của model
    // thêm 3 hàm mới để khai báo mô hình động 
    DynamicModel: require("./dynamic-model"), // new DynamicModel(db, table_name, jsonTextModel) để tạo ra một model
    models: require("./models"),  // (db, jsonTextModels) khởi tạo một tập models 
    dbConnectionPool: require("./database/db-connection-pool"), // kết nối csdl
}