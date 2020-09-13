// ví dụ khai báo một csdl như sau: ví dụ mở kết nối csdl thử
const connJsonMongodb = require("../cfg/orm-mongodb-cfg")

// nhúng gói giao tiếp csdl và mô hình vào
const { Model, DataTypes, database } = require("../node-js-orm")
// khai báo và kết nối csdl để giao tiếp
const db = new database.NodeDatabase(connJsonMongodb);


const { waiting } = require("cng-node-js-utils");

waiting(20000, { hasData: () => db.isConnected() }).then(
    async (timeoutMsg) => {
        // console.log("kết nối", db.isConnected());
        if (!timeoutMsg) {
            // ví dụ:
            // csdl lưu table là user có cấu trúc là {username: string (100, not null),fullname: string(2000), role: number}
            // định nghĩa mô hình của user như sau:
            let user = new Model(
                db, 'users_test',
                {
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
                    fullname: DataTypes.STRING,
                    role: {
                        type: DataTypes.NUMBER,
                        defaultValue: 1
                    },
                    birth_date: DataTypes.DATE,
                    log_time: DataTypes.TIMESTAMP,
                    status: DataTypes.BOOLEAN
                }
            )

            // thực hiện tạo bảng user trong csdl bằng cách gọi lệnh
            try {
                // let x = await user.sync();
                // console.log("Tạo ??", x);


                let jsonData = {
                    // username: 'cuongdq2',
                    nickname: 'xxx',
                    role: '1',
                    birth_date: Date.now(),
                    log_time: Date.now(),
                    status: true
                };

                // bảng user đã được tạo
                // let rslt = await user.create(jsonData);
                // console.log("Kết quả chèn dữ liệu", rslt);

                // update nhé
                let rsltU = await user.update(jsonData, { role: '1' });
                console.log("Kết quả update dữ liệu", rsltU);

                let rst = await user.readAll({});
                console.log("Kết quả select dữ liệu", rst);

            } catch (e) {
                console.log("Lỗi tạo bảng hoặc chèn dữ liệu: ", e);
            }
        }

    });



