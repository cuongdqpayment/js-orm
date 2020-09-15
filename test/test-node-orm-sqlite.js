// ví dụ khai báo một csdl như sau: ví dụ mở kết nối csdl thử
const connJsonSqlite3 ={
    type: "sqlite3",
    isDebug: true,
    database: "./test/database/test-model.db",
    auto_increment_support: true,
} ;

// nhúng gói giao tiếp csdl và mô hình vào
const { Model, DataTypes, database } = require("../node-js-orm")
// khai báo và kết nối csdl để giao tiếp
const db = new database.NodeDatabase(connJsonSqlite3);

let jsonObjModel = {
    id: {
        type: DataTypes.INTEGER,
        notNull: false,
        primaryKey: true,
        autoIncrement: true,
        length: 100
    },
    username: {
        type: DataTypes.STRING,
        notNull: false,
        isUnique: true,
        length: 100
    },
    nickname: {
        type: DataTypes.STRING,
        notNull: false,
        length: 5
    },
    fullname: { type: DataTypes.STRING },
    role: {
        type: DataTypes.NUMBER,
        defaultValue: 1
    },
    birth_date: DataTypes.DATE,
    log_time: { type: DataTypes.TIMESTAMP },
    status: { type: DataTypes.BOOLEAN }
}

// console.log(jsonObjModel);
// for (let key in jsonObjModel) {
//     if (jsonObjModel[key].type)
//         console.log("getTrueData", jsonObjModel[key].type.getTrueData);
//     else
//         console.log("getTrueData...", jsonObjModel[key].getTrueData);
// }


const { waiting } = require("../utils");

waiting(20000, { hasData: () => db.isConnected() }).then(
    async (timeoutMsg) => {
        // console.log("kết nối", db.isConnected());
        if (!timeoutMsg) {
            // ví dụ:
            // csdl lưu table là user có cấu trúc là {username: string (100, not null),fullname: string(2000), role: number}
            // định nghĩa mô hình của user như sau:
            let user = new Model(
                db, 'users_date_number',
                jsonObjModel
            )

            // thực hiện tạo bảng user trong csdl bằng cách gọi lệnh
            try {
                let x = await user.sync();
                console.log("Tạo ??", x);
                // bảng user đã được tạo
                let rslt = await user.create({
                    username: 'cuongdq4',
                    nickname: '12349',
                    role: '99',
                    birth_date: Date.now(),
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

    });



