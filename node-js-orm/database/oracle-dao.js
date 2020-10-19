"use strict";
/**
 * * 4.5 ngày 10/10/2020
 * Bổ sung các mệnh đề $lt,$gt,$in
 * 
 * version 2.0
 * Ngày 30/01/2020
 * Chỉnh sửa kết nối qua pool
 * Thực hiện mở connection mới trong pool
 * Và mỗi phiên truy vấn hoặc excuted phải thực thi qua 1 connection mới
 * Không bị busy khi excute hàm thực thi thời gian dài
 *
 * Su dung doi tuong nay de
 * ket noi connection pool oracle
 * cho phep chay cac lenh:
 * createTable, createTableNotExists,
 * insert,update,delete,
 * select, getRst, getRsts, getAllRsts
 * runSql --> thuc hien khong tra ket qua
 * executeFunction???, refCursor??
 */

const changeMongoWheres2Sql = require("./mongo-where-2-sql");

// const configDefault = {
//   poolAlias: "TestOracleDBPool", //ten cua pool
//   user: "test", //username to oracle
//   password: "test", //password to oracle
//   //connection String to oracle = tnsname
//   connectString: `(DESCRIPTION=
//                     (LOAD_BALANCE=on)
//                     (ADDRESS_LIST=
//                           (ADDRESS=(PROTOCOL=TCP)(HOST=10.151.x.y1)(PORT=1521))
//                           (ADDRESS=(PROTOCOL=TCP)(HOST=10.151.x.y2)(PORT=1521))
//                     )
//                     (CONNECT_DATA=(SERVICE_NAME=TEST))
//                   )`,
//   /*  nếu khai báo server đơn
//   `(DESCRIPTION =
//     (ADDRESS_LIST =
//         (ADDRESS = (PROTOCOL = TCP)(HOST = 127.0.0.1)(PORT = 3005))
//     )\
//     (CONNECT_DATA =
//         (SERVER = DEDICATED)
//         (SERVICE_NAME = XE)
//     )
//   )`, 
//   */
//   poolMax: 2, //so luong pool max
//   poolMin: 2, //so luong pool min
//   poolIncrement: 0, //so luong pool tang len neu co
//   poolTimeout: 4, //thoi gian pool timeout
// };

// var configOracle;

/**
 * Lớp giao tiếp kết nối với csdl oracle
 * Thực hiện các nhiệm vụ
 * Tạo các bảng từ json,
 * Chèn dữ liệu từ danh sách json
 * Thực thi các lệnh insert, update, delete, runSql, executeFunction...
 *
 */
class OracleDAO {
  // conn; // bien luu tru ket noi theo pool
  // pool; // bien luu tru pool sau khi ket noi csdl

  /**
   * Khởi tạo cấu trúc csdl
   * @param {*} dbconfig
   */
  constructor(dbconfig, isDebug) {
    this.isDebug = isDebug;
    this.oracledb = require("oracledb");
    this.oracledb.autoCommit = true;

    this.configOracle = dbconfig;

    this.connectionPool(this.configOracle)
      .then(async (pool) => {
        console.log("Connected to database:" + this.configOracle.connectString);
        this.pool = pool;
        let conn;
        try {
          // thử mở kết nối csdl
          conn = await this.doConnection();
          console.log("Đã kết nối qua Pool " + this.configOracle.poolAlias);
          this.isOpen = true;
        } catch (e) {
          console.log("No connection get with error: ", e);
        } finally {
          // đóng lại connection này ngay lập tức
          this.doRelease(conn);
        }
      })
      .catch((err) => {
        console.log("Connect to database fail:", err);
      });
  }

  isConnected() {
    if (this.pool) return this.isOpen;
    return false;
  }

  /**
   * Thủ tục này sẽ kiểm tra pool đã kết nối để trả về connection mới trong pool để thực thi
   *
   */
  doConnection() {
    return new Promise((resolve, reject) => {
      if (this.pool === undefined || this.pool === null) {
        this.pool = this.oracledb.getPool(this.configOracle.poolAlias); // lay pool cu
        if (!this.pool) {
          reject("No pool init!");
          return;
        }
      }

      this.pool.getConnection((err, connection) => {
        // không thể lấy được kết nối từ pool do lỗi sau
        if (err) {
          console.log("ERROR: Cannot get a connection: ", err);
          reject(err);
          return;
        }

        if (typeof this.pool !== "undefined") {
          console.log(
            "INFO: Connections in use/Connections open: " +
            this.pool.connectionsInUse +
            "/" +
            this.pool.connectionsOpen
          );
        }

        resolve(connection); // trả kết nối lấy được từ pool
      });
    });
  }

  /**
   * Giải phóng kết nối trong pool
   * @param {*} connection
   */
  doRelease(connection) {
    connection.release((err) => {
      if (err) {
        console.log("ERROR: Unable to RELEASE the connection: ", err);
      }
      return;
    });
  }

  /**
   * Lấy kiểu dữ liệu oracle
   */
  getTypes() {
    return this.oracledb;
  }

  /**
   * Thiết lập chế độ không in log
   * @param {*} silence
   */
  setSilence(silence) {
    this.isDebug = !silence;
  }

  /**
   * Tạo các bảng dữ liệu từ sheet tables trong file excel
   * @param {*} tables [{table_name: value, field_name: value, ...}]
   */
  createTables(tables) {
    return new Promise((resolve) => {
      let tables_created = [];
      let countFinish = 0;

      // Khai báo mảng chứa tên bảng duy nhất
      let valueArr = tables.map((o) => {
        return o["table_name"];
      });
      //const distinct = (value, index, self) => { return self.indexOf(value)===index;}
      let distinct_table_name = valueArr.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });

      // hoac 1 cau sau:
      // let distinct_table_name = [...new Set(tables.map(x => x.table_name))];

      //console.log('distinct_table_name', distinct_table_name);
      distinct_table_name.forEach(async (el) => {
        //để cho các lệnh dưới thực hiện tuần tự xong thì mới qua bước kia

        // Lọc lấy các dòng có cùng tên bảng
        let table = tables.filter((x) => x.table_name === el);

        // Nếu có dữ liệu được lọc
        if (table && table.length > 0) {
          //thì chuyển đổi thành chuỗi json chèn dữ liệu vào csdl
          let tableJson = {
            name: el,
            cols: [],
          };

          let createIndexs = [];
          let idx = 0;

          table.forEach((e) => {
            let col = {
              name: e.field_name,
              type: e.data_type,
              option_key: e.options,
              description: e.description,
            };

            tableJson.cols.push(col);

            // Kiểm tra nếu yêu cầu tạo index thì tạo câu lệnh tạo index độc lập riêng
            if (e.option_index === "UNIQUE" || e.option_index === "INDEX") {
              createIndexs.push(
                `CREATE ${(e.option_index === "UNIQUE" ? "UNIQUE" : "")} INDEX idx_${el}_${++idx} ON ${el} (${e.field_name})`
              );
            }
          });

          // Thực hiện tạo bảng bằng dữ liệu json đã chuyển đổi ở trên
          try {
            await this.createTable(tableJson);
            // thông báo tạo xong bảng
            console.log("Create table ok: ", el);

            for (let i = 0; i < createIndexs.length; i++) {
              //thực hiện tạo index sau khi tạo bảng thành công
              await this.runSql(createIndexs[i]);
              console.log("index created: ", `idx_${el}_${i}`);
            }
            // ghi nhận bảng đã tạo xong
            tables_created.push(el);
            countFinish++;
          } catch (err) {
            console.log("Lỗi create table: ", err);
            countFinish++;
          }
        } else {
          countFinish++;
        }

        if (countFinish === distinct_table_name.length) {
          resolve(tables_created);
        }
      });
    });
  }

  /**
   * Tạo dũ liệu cho bảng, từ một mảng dữ liệu json chứa từng bảng ghi
   * @param {*} tableName
   * @param {*} jsonRows {col_name:value,...}
   */
  insertTableData(tableName, jsonRows) {
    return new Promise(async (resovle) => {
      // thiết lập các tham số môi trường để chèn dạng ngày tháng năm, giờ phút giây trước
      // alter session set nls_date_format = 'dd/MON/yyyy hh24:mi:ss'

      // let runSqlOk = await this.runSql(`alter session set nls_date_format = 'dd/MON/yyyy hh24:mi:ss'`);

      // console.log('runSqlOk', runSqlOk);

      let returnFinish = { count_sccess: 0, count_fail: 0 };

      for (let i = 0; i < jsonRows.length; i++) {
        let row = jsonRows[i];
        let jsonInsert = { name: tableName, cols: [] };

        for (let key in row) {
          let col = { name: key, value: row[key] };
          jsonInsert.cols.push(col);
        }

        if (jsonInsert.cols.length > 0) {
          try {
            await this.insert(jsonInsert);
            returnFinish.count_sccess++;
          } catch (err) {
            console.log("err: ", err);
            returnFinish.count_fail++;
          }
        }
      }

      resovle(returnFinish);
    });
  }

  /**
   * Hàm tạo bảng bằng lệnh json
   * @param {*} tableJson
   */
  createTable(tableJson) {
    //neu kiem tra table da co thi khong can tao nua
    return this.getRst(
      `select count(1) count_table from user_tables where table_name = '${tableJson.name.toUpperCase()}'`
    )
      .then((data) => {
        if (data.count_table) {
          return new Promise((resolve, reject) => {
            resolve({
              status: true,
              message: `Create Table: ${tableJson.name} exists!`,
            });
          });
        } else {
          return this.createTableNotExists(tableJson);
        }
      })
      .catch((err) => {
        console.log("Lỗi tạo table:", err);
      });
  }

  /**
   *
   * @param {*} table
   * var table ={
   *              name: 'LOGIN',
   *              cols: [
   *                      {
   *                        name: 'ID',
   *                        type: dataType.number,
   *                        option_key: '',
   *                        description: 'Key duy nhat quan ly'
   *                        }
   *                      ]
   *            }
   */
  createTableNotExists(table, jsonStructure) {
    let sql = "CREATE TABLE " + table.name + " (";
    let i = 0;
    for (var col of table.cols) {
      if (i++ == 0) {
        sql += col.name + " " + col.type + " " + (col.option_key || "");
      } else {
        sql += ", " + col.name + " " + col.type + " " + (col.option_key || "");
      }
    }
    sql += ")";

    return new Promise(async (rs, rj) => {
      try {
        let rsl = await this.runSql(sql);
        // sau khi tạo bảng xong, dựa vào cấu trúc của mô hình mà tạo các khóa, các index độc lập tùy kiểu csdl
        for (let key in jsonStructure) {
          let el = jsonStructure[key];
          // nếu cột nào là index đơn lẻ thì tạo kiểu này
          if (el && (el.isUnique || el.isIndex)) {
            // xử lý lỗi bỏ qua ngay nếu có lỗi trên dòng này
            await this.createIndex(
              table.name,
              key,
              `IDX_${key}_1`,
              el.isUnique
            ).catch((e) => console.log(`Lỗi tạo index:`, e));
          }
          // nếu cột nào có uniqueKeyMulti = orm_unique_multi thì phải tạo kiểu index nhiều cột
          if (el && el.uniqueKeyMulti) {
            // = "table_name, field_name"
            await this.createIndex(
              table.name,
              el.uniqueKeyMulti,
              `IDX_${key}_2`,
              true
            ).catch((e) => console.log(`Lỗi tạo unique Index:`, e));
          }
          // nếu có cột là el.foreignKey orm_foreign_key thì khai báo contraint foreign key
          if (el && el.foreignKey) {
            // = " admin_user(id)"
            await this.createForeignKey(
              table.name,
              key,
              el.foreignKey,
              `FK_${key}_3`
            ).catch((e) => console.log(`Lỗi tạo foreign key:`, e));
          }
        }
        rs(rsl);
      } catch (e) {
        rj(e);
      }
    });
  }

  /**
   *
   * @param {*} tableName
   * @param {*} constraintFields
   * @param {*} referencePrimary
   * @param {*} constraintName
   */
  createForeignKey(
    tableName,
    constraintFields,
    referencePrimary,
    constraintName
  ) {
    return this
      .runSql(`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName}
                        FOREIGN KEY (${constraintFields}) 
                        REFERENCES ${referencePrimary}`);
  }

  /**
   *
   * @param {*} tableName
   * @param {*} indexFields
   * @param {*} isUnique
   * @param {*} indexName
   */
  createIndex(tableName, indexFields, indexName, isUnique) {
    return this.runSql(`CREATE ${isUnique ? "UNIQUE" : ""} 
                        INDEX ${indexName} 
                        ON ${tableName} (${indexFields})`);
  }

  /**
   * Ham chuyen doi mot doi tuong json thanh cau lenh sqlJson
   * su dung de goi lenh db.insert/update/delete/select
   * vi du:
   * convertSqlFromJson(dual_table,{x:null,y:1},['y'])
   * return : {name:dual_table,cols:[{name:x,value:null},{name:y,value:1}],wheres:[name:y,value:1]}
   * Cau lenh tren su dung de:
   *  select x,y from dual_table where y=1;
   * hoac:
   *  update dual_table x=null, y=1 where y=1;
   * hoac
   *  delete
   * hoac
   * insert
   * @param {*} tableName
   * @param {*} obj
   * @param {*} wheres
   */
  convertSqlFromJson(tablename, json, idWheres) {
    let jsonInsert = { name: tablename, cols: [], wheres: [] };
    let whereFields = idWheres ? idWheres : ["id"];
    for (let key in json) {
      jsonInsert.cols.push({ name: key, value: json[key] });
      if (whereFields.find((x) => x === key))
        jsonInsert.wheres.push({ name: key, value: json[key] });
    }
    return jsonInsert;
  }

  //insert
  /**
   *
   * @param {*} insertTable
   * var insertTable={
   *                  name:'tablename',
   *                  cols:[{
   *                        name:'ID',
   *                        value:'1'
   *                        }]
   *                  }
   *
   */
  insert(insertTable) {
    // console.log('json:', insertTable);

    let sql = "INSERT INTO " + insertTable.name + " (";
    let i = 0;
    let idx = 0;
    let sqlNames = "";
    let sqlValues = "";
    let params = [];
    for (let col of insertTable.cols) {
      if (col.value != undefined && col.value != null) {
        // nếu chèn vào kiểu hàm của oracle thì tường minh hàm luôn
        // ví dụ hàm __$to_date('01/01/2019','dd/mm/yyyy')
        //--> tự chuyển thành to_date('01/01/2019','dd/mm/yyyy')
        if (typeof col.value === "string" && col.value.indexOf("__$") === 0) {
          if (i == 0) {
            sqlNames += col.name;
            sqlValues += col.value.substring(3); //kieu index insert trong nodejs this.oracledb xem index-sample.js bat dau tu 0
          } else {
            sqlNames += ", " + col.name;
            sqlValues += ", " + col.value.substring(3);
          }
          i++;
        } else {
          params.push(col.value); //idx theo params
          if (i == 0) {
            sqlNames += col.name;
            sqlValues += ":" + idx++; //kieu index insert trong nodejs this.oracledb xem index-sample.js bat dau tu 0
          } else {
            sqlNames += ", " + col.name;
            sqlValues += ", :" + idx++;
          }
          i++;
        }
      }
    }

    sql += sqlNames + ") VALUES (";
    sql += sqlValues + ")";

    return this.runSql(sql, params);
  }

  //update
  /**
   *
   * @param {*} updateTable
   *  var updateTable={
   *                  name:'tablename',
   *                  cols:[{
   *                        name:'ID',
   *                        value:'1'
   *                        }]
   *                  wheres:[{
   *                         name:'ID',
   *                         value:'1'
   *                         }]
   *                  }
   */
  update(updateTable) {
    let sql = "UPDATE " + updateTable.name + " SET ";

    let i = 0;
    let idx = 0;
    let params = [];
    for (let col of updateTable.cols) {
      if (col.value != undefined && col.value != null) {
        //neu gia tri khong phai undefined moi duoc thuc thi
        // nếu chèn vào kiểu hàm của oracle thì tường minh hàm luôn
        // ví dụ hàm to_date, ...
        if (typeof col.value === "string" && col.value.indexOf("__$") === 0) {
          if (i == 0) {
            sql += col.name + "=" + col.value.substring(3);
          } else {
            sql += ", " + col.name + "=" + col.value.substring(3);
          }
          i++;
        } else {
          params.push(col.value);
          if (i == 0) {
            sql += col.name + "= :" + idx++;
          } else {
            sql += ", " + col.name + "= :" + idx++;
          }
          i++;
        }
      }
    }

    idx = 0;
    i = 0;
    for (let col of updateTable.wheres) {
      if (col.value != undefined && col.value != null) {
        if (typeof col.value === "string" && col.value.indexOf("__$") === 0) {
          if (i == 0) {
            sql += ` WHERE ${col.name}=${col.value.substring(3)}`;
          } else {
            sql += ` AND ${col.name}=${col.value.substring(3)}`;
          }
          i++;
        } else if (Array.isArray(col.value)) {
          // ver 4.0 bổ sung mệnh đề in trong where
          if (i++ == 0) {
            sql += ` WHERE ${col.name} in ('${value.join("','")}')`;
          } else {
            sql += ` AND ${col.name} in ('${value.join("','")}')`;
          }
        } else if (typeof col.value === "object") {
          // ver 4.5 bổ sung thêm các mệnh đề where $lt, $gt, $in như mongodb
          let { iOut, whereS } = changeMongoWheres2Sql(col.name, col.value, i);
          i = iOut;
          sql += whereS;
          // console.log("--->", iOut, whereS);
        } else {
          params.push(col.value);
          if (i == 0) {
            sql += ` WHERE ${col.name}= :${idx++}`;
          } else {
            sql += ` AND ${col.name}= :${idx++}`;
          }
          i++;
        }
      } else {
        sql += " WHERE 1=2"; //menh de where sai thi khong cho update Bao toan du lieu
      }
    }
    return this.runSql(sql, params);
  }

  //delete
  /**
   * Ham xoa bang ghi
   * @param {*} id
   */
  delete(deleteTable) {
    let sql = "DELETE FROM " + deleteTable.name;
    let i = 0;
    let idx = 0;
    let params = [];
    for (let col of deleteTable.wheres) {
      if (col.value != undefined && col.value != null) {
        if (typeof col.value === "string" && col.value.indexOf("__$") === 0) {
          if (i == 0) {
            sql += ` WHERE ${col.name}=${col.value.substring(3)}`;
          } else {
            sql += ` AND ${col.name}=${col.value.substring(3)}`;
          }
          i++;
        } else if (Array.isArray(col.value)) {
          // ver 4.0 bổ sung mệnh đề in trong where
          if (i++ == 0) {
            sql += ` WHERE ${col.name} in ('${value.join("','")}')`;
          } else {
            sql += ` AND ${col.name} in ('${value.join("','")}')`;
          }
        } else if (typeof col.value === "object") {
          // ver 4.5 bổ sung thêm các mệnh đề where $lt, $gt, $in như mongodb
          let { iOut, whereS } = changeMongoWheres2Sql(col.name, col.value, i);
          i = iOut;
          sql += whereS;
          // console.log("--->", iOut, whereS);
        } else {
          params.push(col.value);
          if (i == 0) {
            sql += ` WHERE ${col.name}= :${idx++}`;
          } else {
            sql += ` AND ${col.name}= :${idx++}`;
          }
          i++; //tang i len 1
        }
      } else {
        sql += " WHERE 1=2"; //dam bao khong bi xoa toan bo so lieu khi khai bao sai
      }
    }
    return this.runSql(sql, params);
  }

  //
  /**
   * lenh select, update, delete su dung keu json
   * viet tuong tu sqlite de su dung qua lai
   * @param {*} selectTable
   */
  select(selectTable) {
    let params = [];
    let sql = `SELECT * FROM ${selectTable.name}`;

    let i = 0;

    let sqlNames = "";
    for (let col of selectTable.cols) {
      if (i++ == 0) {
        sqlNames += col.name;
      } else {
        sqlNames += ", " + col.name;
      }
    }

    // fix bug for select * from when no cols
    if (sqlNames) sql = `SELECT ${sqlNames} FROM ${selectTable.name}`;

    i = 0;
    let idx = 0;
    if (selectTable.wheres) {
      for (let col of selectTable.wheres) {
        if (col.value != undefined && col.value != null) {
          if (typeof col.value === "string" && col.value.indexOf("__$") === 0) {
            if (i == 0) {
              sql += ` WHERE ${col.name}=${col.value.substring(3)}`;
            } else {
              sql += ` AND ${col.name}=${col.value.substring(3)}`;
            }
            i++;
          } else if (Array.isArray(col.value)) {
            // ver 4.0 bổ sung mệnh đề in trong where
            if (i++ == 0) {
              sql += ` WHERE ${col.name} in ('${value.join("','")}')`;
            } else {
              sql += ` AND ${col.name} in ('${value.join("','")}')`;
            }
          } else if (typeof col.value === "object") {
            // ver 4.5 bổ sung thêm các mệnh đề where $lt, $gt, $in như mongodb
            let { iOut, whereS } = changeMongoWheres2Sql(col.name, col.value, i);
            i = iOut;
            sql += whereS;
            // console.log("--->", iOut, whereS);
          } else {
            params.push(col.value);
            if (i == 0) {
              sql += ` WHERE ${col.name}= :${idx++}`;
            } else {
              sql += ` AND ${col.name}= :${idx++}`;
            }
            i++;
          }
        }
      }
    }

    // bổ sung thêm mệnh đề sắp xếp order by
    // chỉnh sửa bug order
    if (selectTable.orderbys) {
      let order_by = "";
      for (let col of selectTable.orderbys)
        if (col) order_by += order_by ? `, ${col.value}` : `${col.value}`;
      if (order_by) sql += ` ORDER BY ${order_by}`;
      // console.log("***>", selectTable.orderbys, order_by);
    }

    //console.log(sql);
    //console.log(params);
    return this.getRst(sql, params);
  }
  //lay 1 bang ghi dau tien cua select
  /**
   * lay 1 bang ghi
   * @param {*} sql
   * @param {*} params
   */
  getRst(sql, params = []) {
    return new Promise(async (resolve, reject) => {
      // Tạo mới một Promise thực thi câu lệnh sql
      // lấy một connection mới để thực thi, xong thì release để trả lại
      let connectRunSql;
      try {
        connectRunSql = await this.doConnection();
      } catch (e) {
        // reject('No Connection when do getRst!');
        return;
      }

      connectRunSql.execute(
        sql,
        params,
        {
          outFormat: this.oracledb.OBJECT, //[ { NAME: 'Steven King', EMAIL: 'SKING' } ]
        }, //kieu doi tuong tra ve khong default
        (err, result) => {
          this.doRelease(connectRunSql); // giải phóng connection này ngay tức thì

          if (err) {
            if (this.isDebug) console.log("Could NOT excute: " + sql);
            reject(err);
          }
          //console.log('ket qua: ',result);
          if (result && result.rows && result.rows[0]) {
            resolve(this.ConvertKeysToLowerCase(result.rows[0])); //trả về là một json kết quả select nhu cua sqlite
          } else {
            resolve(); //dua ve khong co bien nao, goi la undifined
          }
        }
      );
    });
  }

  /**
   * Lấy toàn bộ bảng ghi theo mệnh đề where
   * Sắp xếp order,
   * Và phân trang giới hạn bảng ghi truy vấn
   * @param {*} selectTable
   */
  selectAll(selectTable) {
    let sql = `SELECT * FROM ${selectTable.name}`;

    let i = 0;
    let params = [];
    let sqlNames = "";
    for (let col of selectTable.cols) {
      if (i++ == 0) {
        sqlNames += col.name;
      } else {
        sqlNames += ", " + col.name;
      }
    }

    // fix bug for select * from when no cols
    if (sqlNames) sql = `SELECT ${sqlNames} FROM ${selectTable.name}`;

    i = 0;
    let idx = 0;
    if (selectTable.wheres) {
      for (let col of selectTable.wheres) {
        if (col.value != undefined && col.value != null) {
          if (typeof col.value === "string" && col.value.indexOf("__$") === 0) {
            if (i == 0) {
              sql += ` WHERE ${col.name}=${col.value.substring(3)}`;
            } else {
              sql += ` AND ${col.name}=${col.value.substring(3)}`;
            }
            i++;
          } else if (Array.isArray(col.value)) {
            // ver 4.0 bổ sung mệnh đề in trong where
            if (i++ == 0) {
              sql += ` WHERE ${col.name} in ('${value.join("','")}')`;
            } else {
              sql += ` AND ${col.name} in ('${value.join("','")}')`;
            }
          } else if (typeof col.value === "object") {
            // ver 4.5 bổ sung thêm các mệnh đề where $lt, $gt, $in như mongodb
            let { iOut, whereS } = changeMongoWheres2Sql(col.name, col.value, i);
            i = iOut;
            sql += whereS;
            // console.log("--->", iOut, whereS);
          } else {
            params.push(col.value);
            if (i == 0) {
              sql += ` WHERE ${col.name}= :${idx++}`;
            } else {
              sql += ` AND ${col.name}= :${idx++}`;
            }
            i++;
          }
        }
      }
    }

    // bổ sung thêm mệnh đề sắp xếp order by
    // chỉnh sửa bug order
    if (selectTable.orderbys) {
      let order_by = "";
      for (let col of selectTable.orderbys)
        if (col) order_by += order_by ? `, ${col.value}` : `${col.value}`;
      if (order_by) sql += ` ORDER BY ${order_by}`;
      // console.log("***>", selectTable.orderbys, order_by);
    }

    // bổ sung mệnh đề phân trang, chỉ cho oracle 12 trở lên
    if (selectTable.limitOffset) {
      sql += (selectTable.limitOffset.limit ? ` FETCH NEXT ${selectTable.limitOffset.limit} ROWS ONLY` : ``);
      sql += (selectTable.limitOffset.offset ? ` OFFSET ${selectTable.limitOffset.offset} ROWS` : ``);
    }

    return this.getRsts(sql, params);
  }
  /**
   * Lay tat ca cac bang ghi
   * @param {*} sql
   * @param {*} params
   */
  getRsts(sql, params = []) {
    return new Promise(async (resolve, reject) => {
      // Tạo mới một Promise thực thi câu lệnh sql
      // lấy một connection mới để thực thi, xong thì release để trả lại
      let connectRunSql;
      try {
        connectRunSql = await this.doConnection();
      } catch (e) {
        reject("No Connection when do getRsts!");
        return;
      }

      connectRunSql.execute(
        sql,
        params,
        {
          outFormat: this.oracledb.OBJECT, //[ { NAME: 'Steven King', EMAIL: 'SKING' } ]
        }, //option lay ket qua la gi
        (err, results) => {
          this.doRelease(connectRunSql); // giải phóng connection này ngay tức thì

          if (err) {
            if (this.isDebug) console.log("Could NOT excute: " + sql, err);
            reject(err);
          } else {
            //lay ve theo kieu sqlite //khong theo kieu oracle
            if (results && results.rows) {
              let object = this.ConvertKeysToLowerCase(results.rows);
              let rows = [];
              for (let key in object) {
                rows.push(object[key]);
              }
              resolve(rows); //trả về là một json kết quả select nhu cua sqlite
            } else {
              resolve(); //dua ve khong co bien nao, goi la undifined
            }
          }
        }
      );
    });
  }

  /**
   * tra ket qua theo array voi {metaData:[{name:"COL1"}], rows:[[col1,]]
   * @param {*} sql
   * @param {*} params
   */
  getAllRsts(sql, params = []) {
    return new Promise(async (resolve, reject) => {
      // Tạo mới một Promise thực thi câu lệnh sql
      // lấy một connection mới để thực thi, xong thì release để trả lại
      let connectRunSql;
      try {
        connectRunSql = await this.doConnection();
      } catch (e) {
        reject("No Connection when do getAllRsts!");
        return;
      }

      connectRunSql.execute(
        sql,
        params,
        {}, //option lay ket qua la gi
        (err, results) => {
          this.doRelease(connectRunSql); // giải phóng connection này ngay tức thì

          if (err) {
            if (this.isDebug) console.log("Could NOT excute: " + sql, err);
            reject(err);
          } else {
            //tra ve kieu json default cho oracle khong co colum nname
            resolve(results);
          }
        }
      );
    });
  }

  /**
   * giả lập gọi hàm như khi gọi trong oracle
   * functionName, [list value of param]
   * ví dụ: let outPut = await db.executeJavaFunction("the_pkg.the_my_function",["value1 for param1", "value2 for param2",...])
   * === execute the_pkg.the_my_function(value1_for_param1,value2_for_param2)
   * @param {*} oracleFunctionName // tên hàm không dùng dấu ()
   * @param {*} params //các tham số đưa vào
   * out put: là kết quả của hàm trong oracle trả về cho nó
   */
  executeJavaFunction(oracleFunctionName, params = []) {
    //ham tra ve ket qua la mot json gia tri
    var bindVars = {};
    bindVars.v_out = {
      type: this.oracledb.STRING,
      dir: this.oracledb.BIND_OUT,
    };
    var bound_params = "";
    let i = 0;
    for (let p of params) {
      var p_in = "p_in_" + i;
      if (i++ == 0) {
        bound_params += ":" + p_in;
      } else {
        bound_params += ", :" + p_in;
      }

      Object.defineProperty(bindVars, p_in, {
        value: p, //gia tri bien duoc bind vao bindVars.p_in_0,1,...n
        writable: true, //cho phep chinh sua du lieu
        enumerable: true, //cho phep doc bien ra lai
        configurable: true, //cho phep xoa bien
      });
    }
    return this.executeFunction(
      "BEGIN :v_out := " + oracleFunctionName + "(" + bound_params + "); END;",
      bindVars
    ).then((result) => {
      return result.v_out;
    });
  }

  /**
   * var bindVars = {
        i:  1, // default direction is BIND_IN. bien IN
        io: { val: '1', dir: this.oracledb.BIND_INOUT }, //bien inout
        o:  { type: this.oracledb.NUMBER, dir: this.oracledb.BIND_OUT } //bien out
      }

      conn.execute(
        "BEGIN :o := taxi_owner.pkg_user.test(:i); END;" //cach 1 goi theo bien = sqlFunction
        ,bindVars //Cach truyen bien vao theo Object json
        , { },
         (err, result) =>{
        if (err) {
            console.log("ERROR: Unable to execute the SQL: ", err);
        }
            console.log(result.outBinds);
      });

   */
  executeFunction(sqlFunction, bindVars) {
    return new Promise(async (resolve, reject) => {
      //Tạo mới một Promise thực thi câu lệnh sql
      // Tạo mới một Promise thực thi câu lệnh sql
      // lấy một connection mới để thực thi, xong thì release để trả lại
      let connectRunSql;
      try {
        connectRunSql = await this.doConnection();
      } catch (e) {
        reject("No Connection when do executeFunction!");
        return;
      }

      connectRunSql.execute(
        sqlFunction,
        bindVars,
        {}, //option lay ket qua la gi
        (err, result) => {
          this.doRelease(connectRunSql); // giải phóng connection này ngay tức thì

          if (err) {
            if (this.isDebug)
              console.log("Could NOT excute: " + sqlFunction, err);
            reject(err);
          }
          //if (this.isDebug) console.log(result);
          if (result && result.outBinds) {
            resolve(result.outBinds); //Trả về một mảng kết quả giá trị của biến output
          } else {
            resolve(this.ConvertKeysToLowerCase(result)); //Trả về doi tuong ket qua luon
          }
        }
      );
    });
  }

  /**
   * Ham thuc thi lenh sql insert, update, delete, call procedure no output get
   *
   * @param {*} sql
   * @param {*} params
   */
  runSql(sql, params = [], options) {
    //Hàm do ta tự đặt tên gồm 2 tham số truyền vào.
    return new Promise(async (resolve, reject) => {
      // Tạo mới một Promise thực thi câu lệnh sql
      // lấy một connection mới để thực thi, xong thì release để trả lại
      let connectRunSql;
      try {
        connectRunSql = await this.doConnection();
      } catch (e) {
        reject("No Connection when do runSql!");
        return;
      }

      connectRunSql.execute(
        sql,
        params,
        options ? options : {}, //option lay ket qua la gi
        (err, result) => {
          this.doRelease(connectRunSql); // giải phóng connection này ngay tức thì

          if (err) {
            if (this.isDebug) console.log("Could NOT excute: " + sql, err);
            reject(err);
          } else {
            //if (this.isDebug) console.log('Executed: ' + sql);
            resolve(result); //Trả về kết quả là một câu lệnh.
            //Trường hợp createTable sẽ undified result
          }
        }
      );
    });
  }

  /**
   * Hàm khởi tạo kết nối theo kiểu pool
   * @param {*} dbconfig
   */
  connectionPool(dbconfig) {
    return new Promise((resolve, reject) => {
      this.oracledb.createPool(
        {
          poolAlias: dbconfig.poolAlias,
          user: dbconfig.user,
          password: dbconfig.password,
          connectString: dbconfig.connectString,
          poolMax: dbconfig.poolMax,
          poolMin: dbconfig.poolMin,
          poolIncrement: dbconfig.poolIncrement,
          poolTimeout: dbconfig.poolTimeout,
        },
        (err, pool) => {
          if (err) {
            console.log("Lỗi tạo pool " + dbconfig.poolAlias, err);
            reject(err);
          } else {
            resolve(pool); // trả về pool để sử dụng, không phải connection
          }
        }
      );
    });
  }

  /**
   * Mặt định getRsts ở oracle thì trả về json toàn chữ IN HOA
   * Do vậy, Hàm này chuyển đổi các key chữ hoa sang chữ thường (oracle => sqlite phù hợp)
   * Để phù hợp với json như sqlite và json object quy ước
   *
   * @param {*} obj
   */
  ConvertKeysToLowerCase(obj) {
    var output = {};
    for (let i in obj) {
      if (Object.prototype.toString.apply(obj[i]) === "[object Object]") {
        output[i.toLowerCase()] = this.ConvertKeysToLowerCase(obj[i]);
      } else if (Object.prototype.toString.apply(obj[i]) === "[object Array]") {
        output[i.toLowerCase()] = [];
        output[i.toLowerCase()].push(this.ConvertKeysToLowerCase(obj[i][0]));
      } else {
        output[i.toLowerCase()] = obj[i];
      }
    }
    return output;
  }
}

module.exports = OracleDAO;
