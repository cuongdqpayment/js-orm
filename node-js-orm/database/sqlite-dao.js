"use strict";
/**
 * 4.5.1 ngày 10/10/2020
 * Bổ sung các mệnh đề $in, $nin, $lt, $gt, $lte, $gte, $ne, $like, $exists, $null
 * 
 * ver 4.0 ngày 01/11/2019
 * Tích hợp hàm chuyển đổi jsonData=>jsonSql
 * Và sử dụng mệnh đề where khi value là array --> in ()
 * Lưu ý, do sử dụng mệnh đề toString() nên nếu array Value là string thì phải có dạng
 * "''" cặp nháy kép trong nháy đơn, thì câu lệnh sql mới thực thi
 * console.log(["'abc'","'xyz'"].toString());
 *
 * Hàm chuyển đổi json -> sql tích hợp
 *
 * ver 3.3 ngày 02/10/2019
 * Khởi tạo bảng và dữ liệu ban đầu từ json
 *
 * Tạo các bảng từ array, và insert data từ array
 *
 * version 3.2
 * debug runSql all parameters
 *
 * version 3.1
 * doi tuong sqlite-dao - cuong.dq
 *
 * repaired 20190105: col.value !=undefined && !=null
 */
const fs = require("fs");
const path = require("path");

const changeMongoWheres2Sql = require("./mongo-where-2-sql");

class SQLiteDAO {
  constructor(dbFilePath, isDebug) {
    this.isDebug = isDebug;

    let pathDb = `${dbFilePath.substring(0, dbFilePath.lastIndexOf("/"))}`;

    console.log("DB_FILE_INPUT:", dbFilePath);
    console.log("CURRENT_DIR:", __dirname);
    console.log("PATH_DIR:", pathDb);

    if (!fs.existsSync(pathDb)) {
      fs.mkdirSync(pathDb, true);
    }
    this.db = new (require("sqlite3").verbose().Database)(dbFilePath, (err) => {
      if (err) {
        console.log("Could NOT connect to database " + dbFilePath, err);
        this.isOpen = false;
      } else {
        console.log("Connected to database " + dbFilePath);
        this.isOpen = true;
      }
    });
  }

  isConnected() {
    if (this.db) return this.isOpen;
    return false;
  }

  /**
   * Hàm chuyển đổi câu lệnh sql insert, update, delete, select từ json
   * @param tablename
   * @param json
   * @param idWheres
   */
  convertSqlFromJson(tablename, json, idWheres = []) {
    let jsonInsert = { name: tablename, cols: [], wheres: [] };
    let whereFields = idWheres ? idWheres : ["id"];
    for (let key in json) {
      let value = json[key];
      // chuyển đổi tất cả các giá trị kiểu object sang stringify trước khi chèn vào
      // Do sử dụng array trong mệnh đề where nên cho phép chuyển đổi trong lệnh update, insert và update
      // if (typeof value === 'object') value = JSON.stringify(value, null, 2);

      jsonInsert.cols.push({ name: key, value: value });
      if (whereFields.find((x) => x === key))
        jsonInsert.wheres.push({ name: key, value: value });
    }
    return jsonInsert;
  }

  /**
   *
   * @param {*} table
   * var table ={
   *              name: 'LOGIN',
   *              cols: [
   *                      {
   *                        name: 'ID',
   *                        type: dataType.integer,
   *                        option_key: 'PRIMARY KEY AUTOINCREMENT',
   *                        description: 'Key duy nhat quan ly'
   *                        }
   *                      ]
   *            }
   */
  createTable(table, jsonStructure) {
    let sql = "CREATE TABLE IF NOT EXISTS " + table.name + " (";
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
              `IDX_${table.name}_${key}_1`,
              el.isUnique
            ).catch((e) => console.log(`Lỗi tạo index:`, e));
          }
          // nếu cột nào có uniqueKeyMulti = orm_unique_multi thì phải tạo kiểu index nhiều cột
          if (el && el.uniqueKeyMulti) {
            // = "table_name, field_name"
            await this.createIndex(
              table.name,
              el.uniqueKeyMulti,
              `IDX_${table.name}_${key}_2`,
              true
            ).catch((e) => console.log(`Lỗi tạo unique Index:`, e));
          }
          // nếu có cột là el.foreignKey orm_foreign_key thì khai báo contraint foreign key
          // if (el && (el.foreignKey)) { // = " admin_user(id)"
          //   await this.createForeignKey(table.name, key, el.foreignKey, `FK_${key}_3`)
          // .catch(e => console.log(`Lỗi tạo foreign key:`, e))
          // }
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
    // SQLite doesn't support the ADD CONSTRAINT
    // console.log(`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName}
    //             FOREIGN KEY (${constraintFields})
    //             REFERENCES ${referencePrimary}`);
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
    let sql = "INSERT INTO " + insertTable.name + " (";
    let i = 0;
    let sqlNames = "";
    let sqlValues = "";
    let params = [];
    for (let col of insertTable.cols) {
      if (col.value != undefined && col.value != null) {
        // chuyển đổi tất cả các giá trị kiểu object sang stringify trước khi chèn vào
        // Do sử dụng array trong mệnh đề where nên cho phép chuyển đổi trong lệnh update, insert và update
        // nếu là đối tượng trong insert thì tự chuyển string nhé
        // còn nếu đối tượng ở mệnh đề where của câu lệnh update phải tự chuyển sang string trước khi update, delete
        if (typeof col.value === "object") {
          params.push(JSON.stringify(col.value, null, 2));
        } else {
          params.push(col.value);
        }

        if (i++ == 0) {
          sqlNames += col.name;
          sqlValues += "?";
        } else {
          sqlNames += ", " + col.name;
          sqlValues += ", ?";
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
    let params = [];
    for (let col of updateTable.cols) {
      if (
        col.value !== undefined &&
        col.value !== null &&
        typeof col.value != "object"
      ) {
        //neu gia tri khong phai undefined moi duoc thuc thi, và giá trị không phải là đối tượng
        params.push(col.value);
        if (i++ == 0) {
          sql += col.name + "= ?";
        } else {
          sql += ", " + col.name + "= ?";
        }
      } else if (col.value === null) {
        // mệnh đề null luôn không tăng i
        if (i++ == 0) {
          sql += col.name + "= null";
        } else {
          sql += ", " + col.name + "= null";
        }
      }
    }

    i = 0;
    for (let col of updateTable.wheres) {
      if (col.value !== undefined && col.value !== null) {
        // ver 4.0 bổ sung mệnh đề in trong where
        if (Array.isArray(col.value)) {
          sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name} in ('${value.join("','")}')`;
        } else if (typeof col.value === "object") {
          // ver 4.5 bổ sung thêm các mệnh đề where $lt, $gt, $in như mongodb
          let { iOut, whereS } = changeMongoWheres2Sql(col.name, col.value, i);
          i = iOut;
          sql += whereS;
          // console.log("--->", iOut, whereS);
        } else {
          params.push(col.value);
          sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name}= ?`;
        }
      } else if (col.value === null) {
        sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name} is null`;
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
    let params = [];
    for (let col of deleteTable.wheres) {
      if (col.value != undefined && col.value != null) {
        // ver 4.0 bổ sung mệnh đề in trong where
        if (Array.isArray(col.value)) {
          sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name} in ('${value.join("','")}')`;
        } else if (typeof col.value === "object") {
          // ver 4.5 bổ sung thêm các mệnh đề where $lt, $gt, $in như mongodb
          let { iOut, whereS } = changeMongoWheres2Sql(col.name, col.value, i);
          i = iOut;
          sql += whereS;
          // console.log("--->", iOut, whereS);
        } else {
          params.push(col.value);
          sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name}= ?`;
        }
      } else if (col.value === null) {
        sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name} is null`;
      } else {
        sql += " WHERE 1=2"; //dam bao khong bi xoa toan bo so lieu khi khai bao sai
      }
    }
    return this.runSql(sql, params);
  }

  //
  /**
   *lenh select, update, delete su dung keu json
   * @param {*} selectTable
   */
  select(selectTable) {
    // tham số để select dữ liệu
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
    if (selectTable.wheres) {
      for (let col of selectTable.wheres) {
        if (col.value != undefined && col.value != null) {
          // ver 4.0 bổ sung mệnh đề in trong where
          if (Array.isArray(col.value)) {
            sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name} in ('${value.join("','")}')`;
          } else if (typeof col.value === "object") {
            // ver 4.5 bổ sung thêm các mệnh đề where $lt, $gt, $in như mongodb
            let { iOut, whereS } = changeMongoWheres2Sql(col.name, col.value, i);
            i = iOut;
            sql += whereS;
            // console.log("--->", iOut, whereS);
          } else {
            params.push(col.value);
            sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name}= ?`;
          }
        } else if (col.value === null) {
          sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name} is null`;
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

    // console.log("Câu sql:", sql);
    // console.log("Tham số", params);
    return this.getRst(sql, params);
  }


  /**
   * Lấy toàn bộ bảng ghi theo mệnh đề where
   * @param {*} selectTable
   */
  selectAll(selectTable) {
    // tham số để select dữ liệu
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
    if (selectTable.wheres) {
      for (let col of selectTable.wheres) {
        if (col.value != undefined && col.value != null) {
          // ver 4.0 bổ sung mệnh đề in trong where
          if (Array.isArray(col.value)) {
            sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name} in ('${value.join("','")}')`;
          } else if (typeof col.value === "object") {
            // ver 4.5 bổ sung thêm các mệnh đề where $lt, $gt, $in như mongodb
            let { iOut, whereS } = changeMongoWheres2Sql(col.name, col.value, i);
            i = iOut;
            sql += whereS;
            // console.log("--->", iOut, whereS);
          } else {
            params.push(col.value);
            sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name}= ?`;
          }
        } else if (col.value === null) {
          sql += (i++ === 0 ? ` WHERE ` : ` AND `) + `${col.name} is null`;
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

    // bổ sung mệnh đề phân trang
    if (selectTable.limitOffset) {
      sql += (selectTable.limitOffset.limit ? ` LIMIT ${selectTable.limitOffset.limit}` : ``);
      sql += (selectTable.limitOffset.offset ? ` OFFSET ${selectTable.limitOffset.offset}` : ``);
    }

    //console.log(sql);
    //console.log(params);
    return this.getRsts(sql, params);
  }

  //lay 1 bang ghi dau tien cua select
  /**
   * lay 1 bang ghi
   * @param {*} sql
   * @param {*} params
   */
  getRst(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          if (this.isDebug) console.log("Could NOT excute: ", sql, params);
          reject(err);
        } else {
          resolve(row || {});
        }
      });
    });
  }

  /**
   * Lay tat ca cac bang ghi
   * @param {*} sql
   * @param {*} params
   */
  getRsts(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, result) => {
        if (err) {
          if (this.isDebug) console.log("Could NOT excute: ", sql, params);
          reject(err);
        } else {
          resolve(result || []);
        }
      });
    });
  }

  //cac ham va thu tuc duoc viet duoi nay
  /**
   * Ham thuc thi lenh sql va cac tham so
   * @param {*} sql
   * @param {*} params
   */
  runSql(sql, params = []) {
    // Hàm do ta tự đặt tên gồm 2 tham số truyền vào.
    return new Promise((resolve, reject) => {
      // Tạo mới một Promise thực thi câu lệnh sql
      this.db.run(sql, params, function (err) {
        // This.db sẽ là biến đã kết nối csdl, ta gọi hàm run của this.db chính là gọi hàm run của sqlite3 trong NodeJS hỗ trợ (1 trong 3 hàm như đã nói ở trên)
        if (err) {
          //Trường hợp lỗi
          if (this.isDebug) console.log("Could NOT excute: ", sql, params, err);
          reject(err);
        } else {
          //Trường hợp chạy query thành công
          resolve("Executed: " + sql); //Trả về kết quả là một object có id lấy từ DB.
        }
      });
    });
  }

}

module.exports = SQLiteDAO;
