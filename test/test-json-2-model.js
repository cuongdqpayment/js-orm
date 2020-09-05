let jsonCfg = {
  table_name: {
    modelDataType: 'STRING',
    notNull: '1',
    uniqueKeyMulti: 'table_name,  field_name',
    length: '30'
  },
  field_name: { modelDataType: 'STRING', notNull: '1', length: '30' },
  description: { modelDataType: 'STRING', length: '500' },
  data_type: { modelDataType: 'STRING', length: '20' },
  options: { modelDataType: 'STRING', length: '300' },
  option_index: { modelDataType: 'STRING', length: '10' },
  orm_data_type: { modelDataType: 'STRING', notNull: '1', length: '20' },
  orm_length: { modelDataType: 'INTEGER', length: '10' },
  orm_not_null: { modelDataType: 'BOOLEAN', length: '1' },
  orm_primary_key: { modelDataType: 'BOOLEAN', length: '1' },
  orm_auto_increment: { modelDataType: 'BOOLEAN', length: '1' },
  orm_is_unique: { modelDataType: 'BOOLEAN', length: '1' },
  orm_unique_multi: { modelDataType: 'STRING', length: '100' },
  orm_foreign_key: { modelDataType: 'STRING' },
  orm_default_value: { modelDataType: 'STRING', length: '100' },
  order_1: { modelDataType: 'INTEGER', length: '10' }
}



// ví dụ khai báo một csdl như sau: ví dụ mở kết nối csdl thử
const connJsonCfg = require("../cfg/orm-sqlite-cfg")
// const connJsonCfg = require("../cfg/orm-mongodb-cfg")
// khai báo và kết nối csdl để giao tiếp
const db = new database.NodeDatabase(connJsonCfg);

// nhúng gói giao tiếp csdl và mô hình vào
const { json2Model, Model, database } = require("../node-js-orm")
let jsonModel = json2Model(jsonCfg)

const { waiting } = require("../utils");

waiting(20000, { hasData: () => db.isConnected() })
  .then(async (timeoutMsg) => {
    // console.log("kết nối", db.isConnected());
    if (!timeoutMsg) {
      // # ... trong đó db là kết nối database, tableName là bảng liên kết
      let model = new Model(db, "tables", jsonModel)

      // 1. tạo bảng
      let x = await model.sync()
        .catch(e => console.log("Lỗi", e));

      console.log("Tạo ??", x);

    }
  });
