### ORM for javascript with sqlite3, oracle, mongodb
## Use with node 12.9 or later for Promise.allSettled

# 1. install
```sh
npm i node-js-orm@latest cng-node-js-utils@latest
```

# 2. test demo define model to sqlite db
```js
 // define connection
const connJsonSqlite3 = {
  type: "sqlite3",
  isDebug: true,
  database: `${__dirname}/db/database/demo-sqlite.db`,
  auto_increment_support: true,
};

// import model
const { Model, database, json2Model } = require("node-js-orm");

// connect db pool
const db = new database.NodeDatabase(connJsonSqlite3);

// define model as:
let jsonStringModel = {
  id: {
    type: "INTEGER",
    notNull: false,
    primaryKey: true,
    autoIncrement: true,
    length: 100,
  },
  username: {
    type: "STRING",
    notNull: false,
    isUnique: true,
    length: 100,
  },
  nickname: {
    type: "STRING",
    notNull: false,
    length: 5,
  },
  fullname: "STRING",
  role: {
    type: "NUMBER",
    defaultValue: 1,
  },
  birth_date: "DATE",
  log_time: "TIMESTAMP",
  status: "BOOLEAN",
};

// convert jsonString to jsonObject for this model
let jsonObjModel = json2Model.jsonText2Model(jsonStringModel);

// define table for this model
let tableName = "test_table";

// # ... init model with db
let model = new Model(db, tableName, jsonObjModel);


const { waiting } = require("cng-node-js-utils");
// waiting for timeout or connected
waiting(20000, { hasData: () => db.isConnected() }).then(async (timeoutMsg) => {
  if (!timeoutMsg) {
    
    // # create table :
    let x = await model.sync();
    console.log("Create table:", x);

    // # insert record into db :
    let rslt = await model.create({
      username: "cuongdq",
    });
    console.log("result of insert:", rslt);
    
    // # read rows from db
    let rsts = await model.readAll({});
    console.log("result of select:", rsts);

  }
});
```

# 3. test import from excel to db sqlite, copy file from `./node-modules/node-js-orm/excel/sample.excel-2-node-orm.xlsx` into `./db/excel/sample.excel-2-node-orm.xlsx`
```js
// define config before use
const connJsonCfg = {
    type: "sqlite3",
    isDebug: true,
    database: `${__dirname}/db/database/demo-sqlite-from-excel.db`,
    auto_increment_support: true,
  };

// define excel with structure
const excelFile = `./db/excel/sample.excel-2-node-orm.xlsx`

// import components of orm model
const { database, excell2Database } = require("node-js-orm")

// init db for connection pool
const db = new database.NodeDatabase(connJsonCfg);
 
const { waiting } = require("cng-node-js-utils");
waiting(20000, { hasData: () => db.isConnected() })
    .then(async (timeoutMsg) => {
        if (!timeoutMsg) {
            // 1. init model from excel file
            let models = await excell2Database.createExcel2Models(db, excelFile)
            console.log("Result of create model:", models.filter(x => x.getName() === "tables").map(x => x.getStructure())[0]);
            // console.log("Result of create model:", models.map(x => x.getName()));
 
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

# 4. Extract excel sheet tables to json Text model for define model
```js
// excel file include the model structure in tables sheet 
const excelFile = `./db/excel/sample.excel-2-node-orm.xlsx`;
// import components of orm model
const { excell2Database, json2Model } = require("node-js-orm");

// read excel `tables` sheet into array and convert into model text json
excell2Database.excel2Array(excelFile)
    .then(arrayTables => {
        let jsonTextModel = json2Model.array2JsonTexts(arrayTables);
        console.log('jsonTextModel: ', jsonTextModel);
        // convert jsonString to jsonObject for this model
        // let jsonObjModel = json2Model.jsonText2Model(jsonTextModel);
    })
    .catch(err => {
        console.log('Lỗi: ', err);
    });
``` 


# 5. for project Make your config in `./cfg/orm-conn-cfg.js` with:
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

# 6. install driver for db:
```sh
npm i sqlite3
# or
npm i oracle
# or
npm i mongodb
```

# 7. Use with json for define model:
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
  // example 
  field_x :
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
  // or 
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
  // example for one model of table
  {
    table_name: {
                  type: 'STRING',
                  notNull: '1',
                  uniqueKeyMulti: 'table_name,  field_name',
                  length: '30'
                },
  field_name: { type: 'STRING', notNull: '1', length: '30' },
  description: { type: 'STRING', length: '500' },
  options: { type: 'STRING', length: '300' },
  option_index: { type: 'STRING', length: '10' },
  orm_data_type: { type: 'STRING', notNull: '1', length: '20' },
  orm_length: { type: 'INTEGER', length: '10' },
  orm_not_null: { type: 'BOOLEAN', length: '1' },
  orm_primary_key: { type: 'BOOLEAN', length: '1' },
  orm_auto_increment: { type: 'BOOLEAN', length: '1' },
  orm_is_unique: { type: 'BOOLEAN', length: '1' },
  orm_unique_multi: { type: 'STRING', length: '100' },
  orm_foreign_key: { type: 'STRING' },
  orm_default_value: { type: 'STRING', length: '100' },
  order_1: { type: 'INTEGER', length: '10' }
  },
  // or table of data_types:
  {
    model: { type: 'STRING', notNull: '1', primaryKey: '1', length: '20' },
    javascript: { type: 'STRING', length: '20' },
    sqlite: { type: 'STRING', length: '20' },
    oracle: { type: 'STRING', length: '20' },
    mongodb: { type: 'STRING', length: '20' }
  }
}
```
- Data types of this model:
```
STRING : for TEXT in sqlite, VARCHAR2(2000) in Oracle
INTEGER : for INTEGER in sqlite, NUMBER in oracle
NUMBER  : for NUMERIC in sqlite, NUMBER in oracle
BOOLEAN : logic 0,1
DATE    : TEXT save date format yyyy-mm-dd in sqlite, Date in oracle
DATETIME : TEXT save date format yyyy-mm-dd hh:mi:ss in sqlite, Date in oracle
TIMESTAMP : milisecond 
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

# 8. Use excel for define model. The sample in excel at sheet `tables`. To make table with model.sync()

- The sample for excel: `./node-js-orm/excel/sample.excel-2-node-orm.xlsx` at sheet tables

- Demo for excel:

```js
// for example:
// const connJsonCfg = require("../cfg/orm-sqlite-cfg")
const connJsonCfg = require("../cfg/orm-mongodb-cfg")
const excelFile = `./node-js-orm/excel/admin.users.friends.v4-migration.xlsx`
// import components of orm model
const { database, excell2Database } = require("node-js-orm")
// init db for connection pool
const db = new database.NodeDatabase(connJsonCfg);

const { waiting } = require("../utils");

// or use setTimeout(()=>{...},5000)
waiting(20000, { hasData: () => db.isConnected() })
    .then(async (timeoutMsg) => {
        // console.log("connect", db.isConnected());
        if (!timeoutMsg) {
            // 1. init model from excel file
            let models = await excell2Database.createExcel2Models(db, excelFile)
            console.log("Result of create model:", models.filter(x => x.getName() === "tables").map(x => x.getStructure())[0]);
            // console.log("Result of create model:", models.map(x => x.getName()));

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

# 9. When db created, no need model, we use only db for insert, update, delete, select and runSql,...

```js
// khai báo thư viện dùng chung, cài đặt thư viện trước khi dùng
const { waiting } = require("cng-node-js-utils");

// khai báo file cấu hình trước khi dùng
const connJsonSqlite3 = {
  type: "sqlite3",
  isDebug: true,
  database: `${__dirname}/db/database/demo-sqlite-from-excel.db`,
  auto_increment_support: true,
};

// nhúng gói giao tiếp csdl và mô hình vào
const { database } = require("node-js-orm");
// khởi tạo kết nối csdl để giao tiếp
const db = new database.NodeDatabase(connJsonSqlite3);

// khai báo tên bảng để truy vấn dữ liệu,
let tableName = "tables";

// khởi tạo hàm thời gian chờ kết nối csdl hoặc quá thời gian mà csdl không kết nối được
waiting(20000, { hasData: () => db.isConnected() }).then(async (timeoutMsg) => {
    if (!timeoutMsg) {

        // # insert db
        let iRslt = await db.insertOne(tableName, { table_name: "test", field_name: "abc", orm_data_type: "INTEGER" })
        console.log("result of insert", iRslt);

        // # read rows from db
        let rsts = await db.selectAll(
            tableName,
            {},
            { table_name: 1, field_name: 1 }
        );
        // == select table_name, field_name from tables 
        console.log("result of select:", rsts);

        // # select one record
        let rst1 = await db.selectOne(
            tableName,
            {},
            { table_name: 1, field_name: 1 }
        );
        // == select table_name, field_name from tables 
        console.log("result of select 1:", rst1);

        // // # the same old sql
        db.getRsts(`select table_name, field_name from ${tableName}`)
            .then(data => {
                console.log('Data: ', data);
            })
            .catch(err => {
                console.log('Lỗi: ', err);
            });

        // # run excute sql 
        db.runSql(`update tables set field_name=? where table_name=?`, ["efc", "test"])
            .then(data => {
                console.log('Data: ', data);

                db.getRst(`select table_name, field_name from ${tableName} where table_name='test'`)
                    .then(data => {
                        console.log('Data: ', data);
                    })
                    .catch(err => {
                        console.log('Lỗi: ', err);
                    });


            })
            .catch(err => {
                console.log('Lỗi: ', err);
            });
    }
});
```

# Make Models Easy:

- 1. Define Models in `json-text-model.js` such as
```js
module.exports = {
  // one model with name your_table_name as table_name in db
    your_table_name: {
        username: { type: 'STRING', notNull: '1', isUnique: '1' },
        function_groups: { type: 'STRING' },
        function_apis: { type: 'STRING' },
        updated_time: { type: 'DATETIME' },
        updated_user: { type: 'STRING' },
        status: { type: 'BOOLEAN' }
    }
  // ... and more models ...
}
```

- 3 define connection pool following in `./db/db-connection-pool.js`
```js
const connJsonCfg = {
    type: "sqlite3",
    isDebug: true,
    database: `${__dirname}/database/admin-users.db`,
    auto_increment_support: true,
};
// import components of orm model
const { database } = require("node-js-orm");
// init db for connection pool
module.exports = new database.NodeDatabase(connJsonCfg);
```

- 2. Define Your Model following:
```js
// table name in db
const tableName = "your_table_name";
// import text object of model
const { your_table_name } = require("./json-text-models")
// import from lib
const { Model, json2Model } = require("node-js-orm");
// define connection to db pool - see 
const db = require("./db/db-connection-pool");

// define your Model such as
class YourModelName extends Model() {
    constructor(db, tableName, model) {
        // call parent..
        super(db, tableName, model);
    }
    // make your method in here

}

// Export your model to app
module.exports = new YourModelName(db, tableName, json2Model.jsonText2Model(your_table_name))
```

# 10 select with limit and offset in oracle/mongodb/sqlite3
```js

// where clauses:
// * $lt <, 
// * $lte <=, 
// * $gt >, 
// * $gte >=, 
// * $ne !=, 
// * $in [], 
// * $nin [], 
// * $like [],  *x* = %x%
// * $null true/false, is null
// * $exists true/false is not null

// read where id=10
db.selectAll({id:10}, {id:1,field:1}, {order_1: -1}, {limit:10, offset: 0})

// read where id like '1%'
db.selectAll({id:{$like:"1*"}}, {id:1,field:1}, {order_1: -1}, {limit:10, offset: 0})
// read where id in (1,2)
db.selectAll({id:{$in:["1","2"]}}, {id:1,field:1}, {order_1: -1}, {limit:10, offset: 0})
// ...

// let jsonWheres = { table_name: "tables" }
// let jsonWheres = { order_1: { $in: [ "3", "4A", "5"] } }
// let jsonWheres = { order_1: { $lt: "5" } }
// let jsonWheres = { order_1: { $lte: "5" } }
// let jsonWheres = { order_1: { $gt: "5" } }
// let jsonWheres = { order_1: { $gte: "5" , $lte: "7"} }
// let jsonWheres = { order_1: { $like: "*5*" } }
// let jsonWheres = { order_1: { $null: false } }
// let jsonWheres = { order_1: { $exists: false } }
// let jsonWheres = { order_1: { $ne: 1 } }
// let jsonWheres = { order_1: { $nin: [ "1", "2", "5"] } }

```

# 11 Define any models follow jsonTextModels
```js
// define config for db such as: sqlite3
const connJsonCfg = {
    type: "sqlite3",
    isDebug: true,
    database: `${__dirname}/database/sample-test.db`,
    auto_increment_support: true,
};

// user define config for table structure as ORM such as:
const jsonTextModels = {
  tables: {
    table_name: {
      type: 'STRING',
      notNull: '1',
      uniqueKeyMulti: 'table_name,  field_name',
      length: '30'
    },
    field_name: { type: 'STRING', notNull: '1', length: '30' },
    description: { type: 'STRING', length: '2000' },
    data_type: { type: 'STRING', length: '20' },
    options: { type: 'STRING', length: '500' },
    option_index: { type: 'STRING', length: '10' },
    orm_data_type: { type: 'STRING', notNull: '1', length: '20' },
    orm_length: { type: 'INTEGER', length: '10' },
    orm_not_null: { type: 'BOOLEAN', length: '1' },
    orm_primary_key: { type: 'BOOLEAN', length: '1' },
    orm_auto_increment: { type: 'BOOLEAN', length: '1' },
    orm_is_unique: { type: 'BOOLEAN', length: '1' },
    orm_unique_multi: { type: 'STRING', length: '100' },
    orm_foreign_key: { type: 'STRING' },
    orm_default_value: { type: 'STRING', length: '100' },
    order_1: { type: 'INTEGER', length: '10' }
  },
  data_types: {
    model: { type: 'STRING', notNull: '1', primaryKey: '1', length: '30' },
    javascript: { type: 'STRING', length: '30' },
    sqlite: { type: 'STRING', length: '30' },
    oracle: { type: 'STRING', length: '30' },
    mongodb: { type: 'STRING', length: '30' },
    description: { type: 'STRING', length: '2000' }
  }
};

// use lib
const { models, database } = require("node-js-orm");

// define connect to db
const db = new database.NodeDatabase(connJsonCfg);

// list of model in ORM
const myModels = models(db,jsonTextModels);

// list of model_name or table_name
const tableModels = Object.keys(jsonTextModels);

let myTable = "tables";

let myModel = myModels[myTable];


myModel.sync() // create table
    .then(data => {
        console.log('Data: ', data);
    })
    .catch(err => {
        console.log('Lỗi: ', err);
    });;

myModel.getFirstRecord()
    .then(data => {
        console.log('Data: ', data);
    })
    .catch(err => {
        console.log('Lỗi: ', err);
    });;

// get model for CRUD - create table, insert/import, select, update, delete
// - this.sync() = create table
// - this.getStructure() = return structure
// - this.getName() = return table_name
// - this.getDb() = return db (object database)
// - this.create() = insert - C
// - this.read()   = select - R
// - this.update() = update - U
// - this.delete() = delete - D
// - this.readCount() return count of record in table
// - this.readPage() = the same getPage()
// - this.readAll() = select * or all from ... 

// - getCount()
// - getPage()
// - getAllData()
// - getFirstRecord()
// - insertOneRecord()
// - importRows()
// - updateOneRecord()
// - updateAll()
// - deleteOneRecord()
// - deleteAll()

```