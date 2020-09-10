// VÍ DỤ: sử dụng giao tiếp csdl chứ không dùng mô hình
// có thể thực hiện được các nghiệp vụ, chèn, cập nhập, xóa, chọn, chạy hàm, chạy câu lệnh...

// LƯU Ý: Khi sử dụng thuần db, thì các kiểu dữ liệu phải tự chuyển đổi trước khi đưa vào csdl
// nếu sử dụng mô hình được định nghĩa thì mô hình sẽ tự chuyển đổi kiểu dữ liệu để đưa vào nhanh hơn

// ví dụ khai báo một csdl như sau: ví dụ mở kết nối csdl thử
const connJsonSqlite3 = require("../../cfg/orm-sqlite-cfg")
/* {
    type: "sqlite3",
    isDebug: true,
    database: "./db/database/test-model.db",
    auto_increment_support: true,
} */;

// nhúng gói giao tiếp csdl và mô hình vào
const { database } = require("../index")
// khai báo và kết nối csdl để giao tiếp
const db = new database.NodeDatabase(connJsonSqlite3);

const { waiting } = require("../../utils");

waiting(20000, { hasData: () => db.isConnected() }).then(
    async (timeoutMsg) => {
        // console.log("kết nối", db.isConnected());
        if (!timeoutMsg) {

            // thực hiện tạo bảng user trong csdl bằng cách gọi lệnh
            try {

                let rslt = await db.insertOne('users_date_number', {
                    username: 'cuongdq1',
                    nickname: '12349',
                    role: '99',
                    birth_date: Date.now(),
                    log_time: Date.now(),
                    status: true
                });
                console.log("Kết quả chèn dữ liệu", rslt);

                let rst = await db.selectAll('users_date_number');
                console.log("Kết quả dữ liệu", rst);

            } catch (e) {
                console.log("Lỗi tạo bảng hoặc chèn dữ liệu: ", e);
            }
        }

    });



