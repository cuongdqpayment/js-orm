/**
 * Gói này sẽ đọc dữ liệu từ excel, chuyển thành json
 * Sau đó kết nối csdl, tạo bảng, kiểm tra các dữ liệu và chèn dữ liệu vào csdl tương ứng
 * 
 */

// nhúng mô hình 
const xlsxtojson1st = require("xlsx-to-json-lc");
// nhúng mô hình giao tiếp dữ liệu để xử lý tạo bảng, chèn dữ liệu từ excel
const Model = require("./model");
const DataTypes = require("./data-types");

// sử dụng Promise.allSettled để thay cho Promise.all để bỏ qua các lỗi và cho thực thi tiếp
// chỉ hỗ trợ từ node 12.9 trở lên
const allSettled = require('promise.allsettled');
allSettled.shim();

// Cấu trúc bảng json tạo bảng gồm, 
// nếu trên sheet tables mà các tên trường thay đổi không như mặt định thì phải khai báo lại
const SHEET_CFG = "tables"
const HEADER_CFG = {
    table_name: "table_name"
    , field_name: "field_name"
    , description: "description"
    , data_type: "data_type"
    , options: "options"
    , option_index: "option_index"
    , orm_data_type: "orm_data_type"
    , orm_length: "orm_length"
    , orm_not_null: "orm_not_null"
    , orm_primary_key: "orm_primary_key"
    , orm_auto_increment: "orm_auto_increment"
    , orm_is_unique: "orm_is_unique"
    , orm_unique_multi: "orm_unique_multi"
    , orm_default_value: "orm_default_value"
    , orm_foreign_key: "orm_foreign_key"
    , order_1: "order_1"
}

/**
 * Đọc excel chuyển thành mảng json để xử lý
 * @param {*} excelFilename 
 * @param {*} sheetName 
 */
const excel2Json = (excelFilename, sheetName = SHEET_CFG) => {
    return new Promise((rs, rj) => {
        xlsxtojson1st({
            input: excelFilename,   // tên file cần lấy dữ liệu excel .xlsx 
            sheet: sheetName,       // Tên bảng cần lấy dữ liệu default là "tables"
            output: null,           // since we don't need output.json
            lowerCaseHeaders: true  // converts excel header rows into lowercase as json keys
        }, (err, results) => {
            if (err) {
                rj(err)
                return;
            }
            rs(results)
        })
    })
}

/**
 * Thực hiện định nghĩa các mô hình và trả về mảng mô hình 
 * dùng để tạo bảng hoặc chèn dữ liệu
 * @param {*} db 
 * @param {*} excelFilename 
 * @param {*} sheetName 
 * @param {*} headerCfg 
 */
const createExcel2Models = (db, excelFilename, sheetName = SHEET_CFG, headerCfg = HEADER_CFG) => {
    return excel2Json(excelFilename, sheetName)
        .then(tables => {
            // khai báo các biến lưu trũ kết quả
            let result = { table_models: [] }
            // mảng lọc các tên bảng độc lập
            let distinct_table_name = [...new Set(tables.map(x => x[headerCfg.table_name]))];
            // duyệt tất cả các bảng đã lấy được
            for (let tableName of distinct_table_name) {
                // Lọc lấy các dòng có cùng tên bảng [{table_name, data_type, options, descriptions, ...} , ...]
                let tableCols = tables.filter((x) => x[headerCfg.table_name] === tableName);
                // Nếu có dữ liệu được lọc có độ dài
                if (tableCols && tableCols.length > 0) {
                    let jsonTableModel = {}
                    for (let col of tableCols) {
                        // cấu hình định nghĩa cho trường dữ liệu
                        let fiedlCfg = {
                            type: DataTypes[col[headerCfg.orm_data_type]],
                            modelDataType: col[headerCfg.orm_data_type],
                            notNull: col[headerCfg.orm_not_null],
                            primaryKey: col[headerCfg.orm_primary_key],
                            isUnique: col[headerCfg.orm_is_unique],
                            uniqueKeyMulti: col[headerCfg.orm_unique_multi],
                            foreignKey: col[headerCfg.orm_foreign_key],
                            autoIncrement: col[headerCfg.orm_auto_increment],
                            length: col[headerCfg.orm_length],
                            defaultValue: col[headerCfg.orm_default_value],
                        }
                        Object.defineProperty(jsonTableModel, col[headerCfg.field_name], {
                            value: fiedlCfg, writable: true, enumerable: true, configurable: true,
                        })
                    }
                    result.table_models.push(new Model(db, tableName, jsonTableModel))
                }
            }
            return result.table_models
        })
        .catch(err => {
            throw err;
        });
}

/**
 * Thực hiện tạo các bảng csdl kiểu database, khi kết nối database đã được tạo trước đó
 * @param {*} db 
 * @param {*} excelFilename 
 * @param {*} sheetName 
 */
const createExcel2Tables = (models) => {
    // gán tác động Promise tạo bảng (chưa tạo)
    let modelSync = [];
    for (let model of models) {
        modelSync.push(model.sync())
    }
    // thực hiện động tác tạo bảng cho tất cả các mô hình cùng một lúc
    // return Promise.all(modelSync)
    // thực hiện tạo bảng kể cả bảng lỗi cũng tạo và trả kết quả tạo ra
    return Promise.allSettled(modelSync)
}


/**
 * Một mô hình đã định nghĩa, một mảng dữ liệu đầu vào cần đưa vào csdl
 * @param {*} model 
 * @param {*} arrJson 
 */
const importArray2Database = (model, arrJson, GROUP_COUNT = 100, isDebug) => {
    if (!model || !arrJson || !arrJson.length) {
        return new Promise((rs, rj) => rj(`Không khai báo đầy đủ các biến vào: model, arrJson hoặc không có dữ liệu để chèn`));
    }
    return new Promise(async (rs, rj) => {
        let result = { table_name: model.getName(), count_insert: 0, count_fail: 0, group_batch: GROUP_COUNT }
        for (let i = 0; i < arrJson.length; i += GROUP_COUNT) {
            const insertModels = arrJson.slice(i, i + GROUP_COUNT).map((row) => {
                // Mỗi đợt GROUP_COUNT chúng ta đưa vào mảng xử lý promise
                return model.create(row)
            })
            // insertModels sẽ có 100 hoặc ít hơn các promise đang chờ xử lý.
            // Promise.all sẽ đợi cho đến khi tất cả các promise 
            // Promise.allSettled sẽ đợi cho đến khi tất cả các promise 
            //đã được giải quyết và sau đó thực hiện 100 lần tiếp theo.
            let rslt = await Promise.allSettled(insertModels)
            // sử dụng allSettled sẽ trả về tất cả kết quả, không trả catch
            // .catch(e => {
            //     result.count_fail += 1
            //     console.log(`Error in insert to database for the batch ${i} - ${e}`)
            // })
            if (rslt) {
                if (isDebug) console.log(`Kết quả chèn:`, rslt)
                // console.log(`Kết quả chèn thành công:`, rslt.map(x => x.status === "fulfilled"))
                // console.log(`Kết quả chèn thất bại:`, rslt.map(x => x.status === "rejected"))
                result.count_fail += rslt.filter(x => x.status === "rejected").length
                result.count_insert += rslt.filter(x => x.status === "fulfilled").length
            }
        }
        rs(result)
    })
}


/**
 * đọc file excel, liệt kê các sheet có dữ liệu và thực hiện import
 * @param {*} models          // lấy danh mục các mô hình để kiểm tra tính ràng buộc dữ liệu
 * @param {*} excelFilename   // có thể dùng file data khác (không chứa mô hình)
 * @param {*} dataSheets = [`tên bảng`,...]// tên sheet trùng tên bảng cần chèn dữ liệu
 */
const importExcel2Database = async (models, excelFilename, dataSheets, GROUP_COUNT = 100, isDebug) => {
    if (!models || !excelFilename || !dataSheets || !dataSheets.length) {
        return new Promise((rs, rj) => rj(`Không khai báo đầy đủ các biến vào: models, excelFilename, dataSheets hoặc không có sheet lấy dữ liệu`));
    }
    let importModels = [];
    for (let tableName of dataSheets) {
        let results = await excel2Json(excelFilename, tableName)
            .catch(err => {
                console.log('Lỗi đọc sheet ', err);
            });
        // Loại bỏ các cell='' thành null hoặc undefined 
        let arrJson = JSON.parse(JSON.stringify(results,
            (key, value) => {
                if (value === null || value === '') { return undefined; }
                return value;
            },
            2));
        // lấy mô hình của chính bảng dữ liệu đó
        let model = models.find(x => x.getName() === tableName)
        if (model) importModels.push(importArray2Database(model, arrJson, GROUP_COUNT, isDebug))
    }
    // thực hiện chèn dữ liệu làm đồng thời song song các bảng
    return Promise.all(importModels)
}

module.exports = {
    // chuyển đổi excel sang arrayJson
    excel2Json
    // Khởi tạo mô hình để kiểm tra dữ liệu và giao tiếp csdl
    // chuyển đổi dữ liệu của một sheet định nghĩa về mô hình, trở thành mô hình để thao tác giao tiếp
    , createExcel2Models
    // thực hiện tạo bảng dữ liệu từ mô hình
    // duyệt tất cả các mô hình đã định nghĩa, thực hiện tạo bảng cho nó
    , createExcel2Tables
    // thực hiện chèn dữ liệu từ file excel vào mô hình đã định nghĩa trước
    // tên sheet_name = table_name = model_name
    , importExcel2Database
    // thực hiện chèn mảng json vào csdl thông qua mô hình đã định nghĩa trước đó
    , importArray2Database
}