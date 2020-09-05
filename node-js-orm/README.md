## ORM for javascript with sqlite3, oracle, mongodb
# Use with node 12.9 or later for Promise.allSettled

# 1. Make your config in `./cfg/orm-conn-cfg.js` with:
```js
module.exports = {
  type: "sqlite3", //  "mongodb" | "oracle" | "sqlite3"
  isDebug: true,
  database: "../db/database/node-js-orm-demo-sqlite3.db",
  // for db with authentication
  hosts: [{ host: "localhost", port: 8080 }],
  username: "test",
  password: "test123",
  // for oracle
  pool: {
    name: "Node-Orm-Pool",
    max: 2,
    min: 2,
    increment: 0,
    idle: 10000,
    timeout: 4,
  },
  // for mongodb 
  repSet: "rs0", // db replicate
  isRoot: true, // if user of mongo with root right
  // for db support auto increment
  auto_increment_support: true,
}
```

# 2. install driver for db:
```sh
npm i sqlite3
# or
npm i oracle
# or
npm i mongodb
```
# 3. Use with json for define model:
```json
let jsonData = 
{
  "Tên trường": {
    "orm_data_type":"Kiểu dữ liệu",
    "orm_length":"Độ dài dữ liệu",
    "orm_not_null":"ràng buộc không null",
    "orm_primary_key":"Khóa chính",
    "orm_auto_increment":"Tự động tăng INTEGER",
    "orm_is_unique":"là unique",
    "orm_unique_multi":"là unique nhiều trường",
    "orm_foreign_key":"Khóa ngoại lai với bảng",
    "orm_default_value":"giá trị mặt định",
  },
  // hoặc 
  {
    type: "INTEGER",
    notNull: false,
    primaryKey: true,
    foreignKey: undefined,
    autoIncrement: true,
    isUnique: undefined,
    uniqueMulti: undefined,
    length: 100,
    defaultValue: undefined
  },
  // ví dụ:
  "field_name": {
    "orm_data_type": "STRING",
    "orm_not_null": "1",
    "orm_unique_multi": "user_id,client_id",
    "orm_foreign_key": "admin_user(id)",
    "orm_default_value": "1",
    "orm_length": "30",
    "orm_auto_increment": "",
    "orm_primary_key": "",
    "orm_is_unique": "",
  },
  // hoặc
  
}
```
- Data types of this model:
```
STRING : kiểu chuỗi, text
INTEGER : kiểu số nguyên, đánh số 
NUMBER  : Kiểu số thập phân 
BOOLEAN : kiểu logic 0,1
DATE    : Kiểu ngày
DATETIME : Kiểu ngày giờ
TIMESTAMP : Kiểu mili giây
```
- Test case for run:

```js
// # lấy biến vào là khai báo jsonData ở trên
const {json2Model, Model} = require("./node-js-orm")
let jsonModel = json2Model(jsonData)
// # ... trong đó db là kết nối database, tableName là bảng liên kết
let model = new Model(db, tableName, jsonModel)

// # Tạo bảng :
 await model.sync();

// # chèn dữ liệu :
let rslt = await model.create({
                    username: 'cuongdq'
                });
// # đọc dữ liệu
let rst = await model.readAll({});
```

# 4. Use excel for define model. The sample in excel at sheet `tables`. To make table with model.sync()

- The sample for excel: `./db/excel/sample.excel-2-node-orm.xlsx` at sheet tables

- Demo for excel:

```js
// ví dụ khai báo một csdl như sau: ví dụ mở kết nối csdl thử
// const connJsonCfg = require("../cfg/orm-sqlite-cfg")
const connJsonCfg = require("../cfg/orm-mongodb-cfg")
const excelFile = `./db/excel/admin.users.friends.v4-migration.xlsx`
// nhúng gói giao tiếp csdl và mô hình vào
const { database, excell2Database } = require("../node-js-orm")
// khai báo và kết nối csdl để giao tiếp
const db = new database.NodeDatabase(connJsonCfg);

const { waiting } = require("../utils");

waiting(20000, { hasData: () => db.isConnected() })
    .then(async (timeoutMsg) => {
        // console.log("kết nối", db.isConnected());
        if (!timeoutMsg) {
            // 1. Thực hiện tạo mô hình từ excel file
            let models = await excell2Database.createExcel2Models(db, excelFile)
            console.log("KQ Tạo mô hình:", models.filter(x => x.getName() === "tables").map(x => x.getStructure())[0]);
            // console.log("KQ Tạo mô hình:", models.map(x => x.getName()));

            // 2. Thực hiện tạo bảng từ mô hình, nếu bảng đã tạo, index đã tạo trước đó thì sẽ báo lỗi
            let resultTable = await excell2Database.createExcel2Tables(models)
            console.log("KQ tạo bảng:", resultTable);

            // 3. Định nghĩa các bảng cần chèn dữ liệu vào
            let tableNames = ["admin_users"]

            // 4. Thực hiện đọc dữ liệu từ 
            let resultImport = await excell2Database.importExcel2Database(models, excelFile, tableNames, 1)
            console.log("KQ import dữ liệu:", resultImport);

        }
    });
```