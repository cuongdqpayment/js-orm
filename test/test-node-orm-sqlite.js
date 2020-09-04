// ví dụ khai báo một csdl như sau: ví dụ mở kết nối csdl thử
const connJsonSqlite3 = require("../cfg/orm-sqlite-cfg")
/* {
    type: "sqlite3",
    isDebug: true,
    database: "./db/database/test-model.db",
    auto_increment_support: true,
} */;

// nhúng gói giao tiếp csdl và mô hình vào
const { Model, database, json2Model } = require("../lib-orm")
// khai báo và kết nối csdl để giao tiếp
const db = new database.NodeDatabase(connJsonSqlite3);

const model = require("./json-model")

const { waiting } = require("../utils");

waiting(20000, { hasData: () => db.isConnected() }).then((timeoutMsg) => {
    // console.log("kết nối", db.isConnected());
    if (!timeoutMsg) {
        // ví dụ:
        // csdl lưu table là user có cấu trúc là {username: string (100, not null),fullname: string(2000), role: number}
        // định nghĩa mô hình của user như sau:
        let user = new Model(
            db, 'users_date_number', json2Model(model)
        )

        // thực hiện tạo bảng user trong csdl bằng cách gọi lệnh
        let a = async () => {
            try {
                let x = await user.sync();
                console.log("Tạo ??", x);
                // bảng user đã được tạo
                let rslt = await user.create({
                    username: 'cuongdq',
                    nickname: '12349',
                    role: '99',
                    birth_date:  Date.now(),
                    log_time: Date.now(),
                    status: true
                });
                console.log("Kết quả chèn dữ liệu", rslt);

                let rst = await user.readAll({});
                console.log("Kết quả dữ liệu", rst);

            } catch (e) {
                console.log("Lỗi tạo bảng hoặc chèn dữ liệu: ", e);
            }
        }

        a();
    }

});



