const DynamicModel = require("./dynamic-model");
/**
 * Khởi tạo một mô hình dữ liệu từ jsonText đưa vào
 * Có thể tạo bảng, tạo cấu trúc dữ liệu, giao tiếp với csdl qua mô hình
 * @param {*} db khai báo csdl giao tiếp kiểu database
 * @param {*} jsonTextModels object json chứa cấu trúc csdl của tập mô hình (mỗi mô hình đại diện 1 bảng) 
 */
module.exports = (db, jsonTextModels) => {
    let models = {};
    for (let tableName in jsonTextModels) {
        // lấy lại cấu hình mô hình từng bảng
        let textModel = jsonTextModels[tableName];
        if (textModel && jsonTextModels[tableName]) {
            models[tableName] = new DynamicModel(db, tableName, textModel);
        }
    }
    return models;
};