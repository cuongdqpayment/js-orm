const DataTypes = require("./data-types");
// các tên trường dữ liệu từ json tương ứng cho mô hình
const HEADER_CFG = require("./header-config");

/**
 * Hàm chuyển đổi array theo cấu trúc bảng của excel sang cấu trúc model clear text
 * Mục tiêu để in ra và copy vào json để khai báo model static nhanh hơn gõ từng dòng
 * Và sau đó không cần đọc file excel nữa, mà chỉ nhìn vào json sẽ thấy được mô hình
 * @param {*} arrTables [] // chứa cấu trúc đọc được từ excel theo mảng
 * @param {*} headerCfg
 */
const array2JsonTexts = (arrTables, headerCfg = HEADER_CFG) => {
  // Mảng trả về các mô hình cấu trúc của từng bảng
  // "table_name":{model text clear}
  let models = {};
  // mảng lọc các tên bảng độc lập
  let distinct_table_name = [
    ...new Set(arrTables.map((x) => x[headerCfg.table_name])),
  ];
  // duyệt tất cả các bảng đã lấy được
  for (let tableName of distinct_table_name) {
    // Lọc lấy các dòng có cùng tên bảng [{table_name, data_type, options, descriptions, ...} , ...]
    let tableCols = arrTables.filter(
      (x) => x[headerCfg.table_name] === tableName
    );
    // Nếu có dữ liệu được lọc có độ dài
    if (tableCols && tableCols.length > 0) {
      let jsonTableModel = {};
      for (let col of tableCols) {
        // cấu hình định nghĩa cho trường dữ liệu theo cấu trúc model kiểu text clear
        let fiedlCfg = {
          type: col[headerCfg.orm_data_type],
          notNull: col[headerCfg.orm_not_null],
          primaryKey: col[headerCfg.orm_primary_key],
          isUnique: col[headerCfg.orm_is_unique],
          uniqueKeyMulti: col[headerCfg.orm_unique_multi],
          foreignKey: col[headerCfg.orm_foreign_key],
          autoIncrement: col[headerCfg.orm_auto_increment],
          length: col[headerCfg.orm_length],
          defaultValue: col[headerCfg.orm_default_value],
        };
        Object.defineProperty(jsonTableModel, col[headerCfg.field_name], {
          value: fiedlCfg,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      Object.defineProperty(models, tableName, {
        value: jsonTableModel,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }
  // chuyển đổi các giá trị là null, là "" thành undefined cho mô hình
  return JSON.parse(
    JSON.stringify(
      models,
      (key, value) => {
        if (value === null || value === "") return undefined;
        return value;
      },
      2
    )
  );
};

/**
 * Hàm chuyển đổi từ json kiểu text định nghĩa sang kiểu json có DataTypes. để giao tiếp với csdl
 * @param {*} jsonTextModel
 */
const jsonText2Model = (jsonTextModel, headerCfg = HEADER_CFG) => {
  if (!jsonTextModel) return {};

  let jsonModel = {};

  for (let key in jsonTextModel) {
    let col = jsonTextModel[key];
    // cấu hình định nghĩa cho trường dữ liệu
    let fiedlCfg = {};
    if (typeof col === "object") {
      fiedlCfg.type =
        DataTypes[col[headerCfg.orm_data_type]] ||
        DataTypes[col["modelDataType"]] ||
        DataTypes[col["type"]] ||
        DataTypes["STRING"];
      if (col[headerCfg.orm_not_null] || col["notNull"])
        fiedlCfg.notNull = col[headerCfg.orm_not_null] || col["notNull"];

      if (col[headerCfg.orm_primary_key] || col["primaryKey"])
        fiedlCfg.primaryKey =
          col[headerCfg.orm_primary_key] || col["primaryKey"];
      if (col[headerCfg.orm_is_unique] || col["isUnique"])
        fiedlCfg.isUnique = col[headerCfg.orm_is_unique] || col["isUnique"];
      if (col[headerCfg.orm_unique_multi] || col["uniqueKeyMulti"])
        fiedlCfg.uniqueKeyMulti =
          col[headerCfg.orm_unique_multi] || col["uniqueKeyMulti"];
      if (col[headerCfg.orm_foreign_key] || col["foreignKey"])
        fiedlCfg.foreignKey =
          col[headerCfg.orm_foreign_key] || col["foreignKey"];
      if (col[headerCfg.orm_auto_increment] || col["autoIncrement"])
        fiedlCfg.autoIncrement =
          col[headerCfg.orm_auto_increment] || col["autoIncrement"];
      if (col[headerCfg.orm_length] || col["length"])
        fiedlCfg.length = col[headerCfg.orm_length] || col["length"];
      if (col[headerCfg.orm_default_value] || col["defaultValue"])
        fiedlCfg.defaultValue =
          col[headerCfg.orm_default_value] || col["defaultValue"];
    } else {
      fiedlCfg.type = DataTypes[col] || DataTypes["STRING"];
    }
    jsonModel[key] = fiedlCfg;
  }
  // trả về mô hình có kiểu dữ liệu kiểu đối tượng của mô hình
  return jsonModel;
};

module.exports = {
  // chuyển đổi từ mảng sang mô hình kiểu text (để copy vào json thuận lợi nhanh hơn)
  array2JsonTexts,
  // chuyển đổi một json thuần text kiểu dữ liệu như "STRING" sang đối tượng dữ liệu của mô hình
  jsonText2Model,
  // bảng lưu danh sách các mô hình
  listModels: {
    model_name: {
      type: "STRING",
      notNull: 1,
      isUnique: 1,
      length: 30,
    },
    db_connection: { type: "STRING", notNull: 1, length: 30 },
    name: { type: "STRING", length: 255 },
    description: { type: "STRING", length: 2000 },
    created_date: { type: 'DATE' },
    updated_time: { type: 'DATETIME' },
    updated_user: { type: 'STRING', length: 50 },
    status: { type: 'BOOLEAN', defaultValue: 1 }
  },
  // Cấu hình lưu trữ mô hình
  modelConfig: {
    table_name: {
      type: "STRING",
      notNull: 1,
      uniqueKeyMulti: "table_name,  field_name",
      length: 30,
    },
    field_name: { type: "STRING", notNull: 1, length: 30 },
    description: { type: "STRING", length: 2000 },
    data_type: { type: "STRING", length: 20 },
    options: { type: "STRING", length: 500 },
    option_index: { type: "STRING", length: 10 },
    orm_data_type: { type: "STRING", notNull: 1, length: 20 },
    orm_length: { type: "INTEGER", length: 10 },
    orm_not_null: { type: "BOOLEAN", length: 1 },
    orm_primary_key: { type: "BOOLEAN", length: 1 },
    orm_auto_increment: { type: "BOOLEAN", length: 1 },
    orm_is_unique: { type: "BOOLEAN", length: 1 },
    orm_unique_multi: { type: "STRING", length: 100 },
    orm_foreign_key: { type: "STRING" },
    orm_default_value: { type: "STRING", length: 100 },
    order_1: { type: "INTEGER", length: 10 },
  },
};
