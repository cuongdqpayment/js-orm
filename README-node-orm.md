
## Mô hình giao tiếp dữ liệu và javascript.
Xây dựng thư viện kết nối cơ sở dữ liệu sqlite, oracle, mongodb, và tổ chức mô hình tương thích các kiểu cơ sở dữ liệu để có thể migrate các cơ sở dữ liệu với nhau một cách thuận lợi nhất
Thư viện này được xây dựng dựa trên các nhu cầu như tạo bảng từ việc khai báo mô hình, hoặc xây dựng mô hình từ file excel, tự động tạo csdl từ file excel, chuyển đổi file excel sang file mô hình text json, và tự động import dữ liệu từ excel hoặc từ csdl này qua csdl khác một cách thuận lợi, nhanh chóng.

# Chương trình được viết có sử dụng  Promise.allSettled nên phải sử dụng node 12.9 trở lên mới dùng được

# 1. Thực hiện khai báo cấu hình kết nối db tại `./cfg/orm-conn-cfg.js`:
```js
module.exports = {
  type: "sqlite3", //  "mongodb" | "oracle" | "sqlite3"
  isDebug: true,
  database: "../db/database/node-js-orm-demo-sqlite3.db",
  // phần giành cho các csdl có xác thực
  hosts: [{ host: "localhost", port: 8080 }],
  username: "test",
  password: "test123",
  // phần giành cho oracle database thêm
  pool: {
    name: "Node-Orm-Pool",
    max: 2,
    min: 2,
    increment: 0,
    idle: 10000,
    timeout: 4,
  },
  // phần giành cho mongodb thêm
  repSet: "rs0", // Khai báo bộ db replicate
  isRoot: true, // nếu user của mongo có quyền root t
  // tham số phụ thêm vào để xác định csdl có hỗ trợ tự tạo auto_increment không?
  // nếu csdl nào không hổ trợ thì tắt nó đi và sử dụng mô hình model để tạo id tự động
  auto_increment_support: true,
}
```

# 2. cài đặt driver kết nối csdl tương ứng nếu sử dụng nó, một trong những hoặc tất cả nếu muốn migration sang:
```sh
npm i sqlite3
# or
npm i oracle
# or
npm i mongodb
```
# 3. Sử dụng json để khai báo mô hình
- LƯU Ý Trường hợp không khai báo định nghĩa mô hình, thì việc tạo các ràng buộc, tự sinh id, chuyển đổi loại dữ liệu trước khi chèn, cập nhập sẽ không áp dụng được, khi đó chỉ có thể chèn các dữ liệu đơn giản như số và chữ.
- Trường hợp không dùng file excel, phải khai báo các JSON chứa cấu trúc của mô hình như sau:
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
- Các kiểu dữ liệu hiện có của mô hình gồm:
```
STRING : kiểu chuỗi, text
INTEGER : kiểu số nguyên, đánh số 
NUMBER  : Kiểu số thập phân 
BOOLEAN : kiểu logic 0,1
DATE    : Kiểu ngày
DATETIME : Kiểu ngày giờ
TIMESTAMP : Kiểu mili giây
```
- Chuyển đổi dữ liệu khai báo mô hình bằng json sang mô hình bằng công cụ:

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

# 4. Sử dụng excel để khai báo mô hình. Định nghĩa mô hình bằng file excel tại sheet `tables` gồm tên bảng, tên trường, kiểu dữ liệu để ràng buộc dữ liệu, cũng như có thể tự động tạo bảng bằng lệnh model.sync()

- Tạo cấu trúc mô hình bằng excel như mẫu `./db/excel/sample.excel-2-node-orm.xlsx` tại sheet tables

- khai báo kết nối dữ liệu như bước 1

- Thực hiện chạy thử tạo bảng và chèn dữ liệu như sau:

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

# Các mô hình test
```sh
node ./test/test-node-orm-sqlite-string.js
```

## -- Xuất bản npm publish
```sh
npm login
# user - namedq@Shrthand login với user - namedq(namedq.pay@g)
# change version on package.json for publish
cd node-js-orm
npm publish
cd ../
```

## - Lệnh push lưu
```sh
git add .
git commit -am "fix version 3.1.7"
git push
```