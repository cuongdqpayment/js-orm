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
```sh
npm i node-js-orm
```

```js
// # get input from jsonData above
let jsonData = {
    id: {
        type: "INTEGER",
        notNull: false,
        primaryKey: true,
        // foreignKey: undefined,
        autoIncrement: true,
        // isUnique: undefined,
        // uniqueMulti: undefined,
        length: 100,
        // defaultValue: undefined
    },
    username: {
        type: "STRING",
        notNull: false,
        isUnique: true,
        length: 100
    },
    nickname: {
        type: "STRING",
        notNull: false,
        length: 5
    },
    fullname: "STRING",
    role: {
        type: "NUMBER",
        defaultValue: 1
    },
    birth_date: "DATE",
    log_time: "TIMESTAMP",
    status: "BOOLEAN"
}
// require db connection 
const connJson = require("../cfg/orm-sqlite-cfg")

// import this library for use
const {json2Model, Model, database} = require("node-js-orm")
// init connection of db
const db = new database.NodeDatabase(connJson);

// change json to jsonModel
let jsonModel = json2Model(jsonData)

// # ... init model with db
let model = new Model(db, tableName, jsonModel)

// # create table :
 await model.sync();

// # insert record into db :
let rslt = await model.create({
                    username: 'cuongdq'
                });
// # read rows from db
let rst = await model.readAll({});
```

# 4. Use excel for define model. The sample in excel at sheet `tables`. To make table with model.sync()

- The sample for excel: `./db/excel/sample.excel-2-node-orm.xlsx` at sheet tables

- Demo for excel:

```js
// ví dụ khai báo một csdl như sau: ví dụ mở connect csdl thử
// const connJsonCfg = require("../cfg/orm-sqlite-cfg")
const connJsonCfg = require("../cfg/orm-mongodb-cfg")
const excelFile = `./db/excel/admin.users.friends.v4-migration.xlsx`
// nhúng gói giao tiếp csdl và mô hình vào
const { database, excell2Database } = require("node-js-orm")
// khai báo và connect csdl để giao tiếp
const db = new database.NodeDatabase(connJsonCfg);

const { waiting } = require("../utils");

// or use setTimeout(()=>{...},5000)
waiting(20000, { hasData: () => db.isConnected() })
    .then(async (timeoutMsg) => {
        // console.log("connect", db.isConnected());
        if (!timeoutMsg) {
            // 1. init model from excel file
            let models = await excell2Database.createExcel2Models(db, excelFile)
            console.log("KQ Tạo mô hình:", models.filter(x => x.getName() === "tables").map(x => x.getStructure())[0]);
            // console.log("KQ Tạo mô hình:", models.map(x => x.getName()));

            // 2. Create table and index
            let resultTable = await excell2Database.createExcel2Tables(models)
            console.log("Result of create table:", resultTable);

            // 3. List tables/sheets to import
            let tableNames = ["admin_users"]

            // 4. Do import into db from sheets of excel listed above 
            let resultImport = await excell2Database.importExcel2Database(models, excelFile, tableNames, 1)
            console.log("Resulte of import db:", resultImport);

        }
    });
```