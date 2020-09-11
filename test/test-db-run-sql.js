// khai báo thư viện dùng chung, cài đặt thư viện trước khi dùng
const { waiting } = require("cng-node-js-utils");

// khai báo file cấu hình trước khi dùng
const connJsonSqlite3 = {
    type: "sqlite3",
    isDebug: true,
    database: `${__dirname}/database/demo-sqlite-from-excel.db`,
    auto_increment_support: true,
};

// nhúng gói giao tiếp csdl và mô hình vào
const { database } = require("../node-js-orm");
// khởi tạo kết nối csdl để giao tiếp
const db = new database.NodeDatabase(connJsonSqlite3);

// khai báo tên bảng để truy vấn dữ liệu,
let tableName = "tables";

// khởi tạo hàm thời gian chờ kết nối csdl hoặc quá thời gian mà csdl không kết nối được
waiting(20000, { hasData: () => db.isConnected() }).then(async (timeoutMsg) => {
    if (!timeoutMsg) {

        // # insert db
        // let iRslt = await db.insertOne(tableName, { table_name: "test", field_name: "abc", orm_data_type: "INTEGER" })
        // console.log("result of insert", iRslt);

        // // # read rows from db
        // let rsts = await db.selectAll(
        //     tableName,
        //     {},
        //     { table_name: 1, field_name: 1 }
        // );
        // // == select table_name, field_name from tables 
        // console.log("result of select:", rsts);

        // // # select one record
        // let rst1 = await db.selectOne(
        //     tableName,
        //     {},
        //     { table_name: 1, field_name: 1 }
        // );
        // // == select table_name, field_name from tables 
        // console.log("result of select 1:", rst1);

        // // # the same old sql
        // db.getRsts(`select table_name, field_name from ${tableName}`)
        //     .then(data => {
        //         console.log('Data: ', data);
        //     })
        //     .catch(err => {
        //         console.log('Lỗi: ', err);
        //     });

        // # run excute sql 
        db.runSql(`update tables set field_name=? where table_name=?`, ["efcdd123", "test"])
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