// ví dụ khai báo một csdl như sau: ví dụ mở kết nối csdl thử
// const connJsonCfg = require("../cfg/orm-sqlite-cfg")
const connJsonCfg = require("../cfg/orm-mongodb-cfg")
// const connJsonCfg = require("../cfg/orm-oracle-cfg")
const excelFile = `./db/excel/admin.users.friends.v4-migration.xlsx`
// nhúng gói giao tiếp csdl và mô hình vào
const { database, excell2Database } = require("../node-orm")
// khai báo và kết nối csdl để giao tiếp
const db = new database.NodeDatabase(connJsonCfg);

const { waiting } = require("../utils");

waiting(20000, { hasData: () => db.isConnected() })
    .then(async (timeoutMsg) => {
        // console.log("kết nối", db.isConnected());
        if (!timeoutMsg) {
            // 1. Thực hiện tạo mô hình từ excel file
            let models = await excell2Database.createExcel2Models(db, excelFile)
            let kq = models.filter(x => x.getName() === "tables").map(x => x.getStructure())[0]
            console.log("KQ Tạo mô hình:", JSON.parse(kq));
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



