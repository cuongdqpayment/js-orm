const DataTypes = require("./data-types")
// các tên trường dữ liệu từ json tương ứng cho mô hình
const JSON_CFG = {
    orm_data_type: "orm_data_type"
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
 * Chuyển đổi json thành json của mô hình
 */
module.exports = (jsonData) => {
    if (!jsonData) return {};

    let jsonModel = {}

    for (let key in jsonData) {
        let col = jsonData[key]
        // cấu hình định nghĩa cho trường dữ liệu
        let fiedlCfg = {
            type: DataTypes[col[JSON_CFG.orm_data_type] || col["modelDataType"] || col["type"]] || DataTypes["STRING"],
            notNull: col[JSON_CFG.orm_not_null] || col["notNull"],
            primaryKey: col[JSON_CFG.orm_primary_key] || col["primaryKey"],
            isUnique: col[JSON_CFG.orm_is_unique] || col["isUnique"],
            uniqueKeyMulti: col[JSON_CFG.orm_unique_multi] || col["uniqueKeyMulti"],
            foreignKey: col[JSON_CFG.orm_foreign_key] || col["foreignKey"],
            autoIncrement: col[JSON_CFG.orm_auto_increment] || col["autoIncrement"],
            length: col[JSON_CFG.orm_length] || col["length"],
            defaultValue: col[JSON_CFG.orm_default_value] || col["defaultValue"],
        }
        Object.defineProperty(jsonModel, key, {
            value: fiedlCfg, writable: true, enumerable: true, configurable: true,
        })
    }

    return jsonModel;
}
