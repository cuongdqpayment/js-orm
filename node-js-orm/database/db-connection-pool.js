/**
 * Khai báo kết nối database theo mô hình sẽ cho phép nối bất kỳ db nào trong thư viện
 */

// khai báo file cấu hình ví dụ của mongodb
/* {
    type: "mongodb", 
    isDebug: true,
    database: "admin-server",
    // phần giành cho các csdl có xác thực
    hosts: [{ host: "192.168.59.5", port: 27017 }],
    username: "cuongdq",
    password: "xxx",
    // phần giành cho mongodb thêm
    //   repSet: "rs0", // Khai báo bộ db replicate
    isRoot: true, // nếu user của mongo có quyền root
    // tham số phụ thêm vào để xác định csdl có hỗ trợ tự tạo auto_increment không?
    // nếu csdl nào không hổ trợ thì tắt nó đi và sử dụng mô hình model để tạo id tự động
    auto_increment_support: false,
}; */

// ví dụ của oracle
/* {
    type: "oracle", 
    isDebug: true,
    database: "BUSINESS",
    // phần giành cho các csdl có xác thực
    hosts: [
      { host: "10.151.59.91", port: 1521 },
      { host: "10.151.59.92", port: 1521 },
    ],
    username: "user",
    password: "pass",
    // phần giành cho oracle database thêm
    pool: {
      name: "Node-Orm-Pool",
      max: 2,
      min: 2,
      increment: 0,
      idle: 10000,
      timeout: 4,
    },
    // tham số phụ thêm vào để xác định csdl có hỗ trợ tự tạo auto_increment không?
    // do oracle 11 nên không tự tạo được id tự tăng mà phải sử dụng mô hình để tạo
    auto_increment_support: false,
  } */

// ví dụ của sqlite
/*   {
    type: "sqlite3",
    isDebug: true,
    database: `${__dirname}/database/admin-resource-users.db`,
    auto_increment_support: true,
  }; */

// import components of orm model
const NodeDatabase  = require("./node-database");

/**
 *
 * @param {*} type  "mongodb" | "oracle" | "sqlite3"
 * @param {*} autoIncrementSupport true | false
 * @param {*} dbName dbname for mongo | servicename for oracle | filename for sqlite3
 * @param {*} userCfg user/pass/hosts/port
 * @param {*} options isRoot & repSet for mongo | pool for oracle
 * @param {*} isDebug true | false
 */
module.exports = (
  type, // đọc từ csdl ra trong mô hình
  autoIncrementSupport, // true or false tự tạo id trong csdl hoặc nhờ mô hình tạo id (như mongodb hoặc oracle 11 trở xuống thì khai false, oracle 12c và sqlite thì khai true)
  dbName, // đọc từ csdl ra trong mô hình
  userCfg, // khai báo cứng ở máy chủ trước - vì cái này liên quan đến thiết lập máy chủ
  options, // tùy chọn theo csdl (mongo thì thêm 2 tham số là isRoot và repset) (oracle thì khai pool kết nối)
  isDebug // để in ra các dòng debug nếu cần
) => {
  return new NodeDatabase({
    type, //  "mongodb" | "oracle" | "sqlite3"
    auto_increment_support: autoIncrementSupport,
    // tên cơ sở dữ liệu - Oracle thì là serviceName, mongodb thì tự khai tự tạo, sqlite thì tự khai tự tạo file riêng cho mỗi phiên
    database: dbName,
    // phần cấu hình địa chỉ ip và username, pass để kết nối csdl (nếu máy chủ csdl)
    ...userCfg,
    // ví dụ: {hosts: [{ host: "192.168.59.5", port: 27017 }],username: "yourUser",password: "yourpass"}

    ...options,
    //  phần giành cho mongodb:
    /* {
      repSet: "rs0", // Khai báo bộ db replicate
      isRoot: true, // nếu user của mongo có quyền root}
    } */
    // hoặc của oracle là :
    /* {
      pool: {
        name: "Node-Orm-Pool",
        max: 2,
        min: 2,
        increment: 0,
        idle: 10000,
        timeout: 4,
      },    
    } */
    isDebug,
  });
};
