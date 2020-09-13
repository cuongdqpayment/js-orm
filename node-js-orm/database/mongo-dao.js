"use strict";
/**
 * Giao tiếp dữ liệu mongo
 * Cho phép tạo database
 * Tạo Tabe = collection
 * Chèn dữ liệu = insert
 * Cập nhập dữ liệu = update
 * Xóa dữ liệu = delete
 * Truy vấn dữ liệu bằng getRst
 *
 * https://docs.mongodb.com/drivers/node/usage-examples/find
 *
 */

class MongoDAO {
  constructor(uri, dbName, isDebug) {
    this.isDebug = isDebug;
    this.client = new (require("mongodb").MongoClient)(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    this.openDb()
      .then((ok) => {
        console.log("Init Database connected!");
        this.isOpen = true;
        if (dbName) this.switchDb(dbName);
      })
      .catch((err) => {
        console.log("Init Lỗi kết nối CSDL:", err);
        this.isOpen = false;
      });
  }

  openDb() {
    return new Promise(async (rs, rj) => {
      try {
        await this.client.connect();
        console.log("Init Mogodb have Databases:");
        let dbs = await this.listDatabases();
        dbs.forEach((name) => console.log(` - ${name}`));
        rs("OK");
      } catch (e) {
        rj(e);
      }
    });
  }

  /**
   * Ktra trạng thái mở kết nối db không
   */
  isConnected() {
    if (this.client) return this.client.isConnected();
    return false;
  }

  /**
   * Đóng csdl lại
   */
  closeDb() {
    if (this.client && this.client.isConnected()) {
      this.client.close();
      this.db = null;
      console.log("Database Closed!");
    }
    this.isOpen = false;
  }

  /**
   * Chuyển csdl để làm việc
   * @param {*} dbName
   */
  switchDb(dbName) {
    if (this.isOpen) {
      this.db = this.client.db(dbName);
      console.log(`Switch to Current Database is: ${this.db.databaseName}`);
    } else {
      console.log(`Database not Open for switch!`);
    }
  }

  /**
   * Lay co so du lieu hien tai
   */
  getCurrentDatabase() {
    if (this.db) return this.db.databaseName;
    else return this.client.db().databaseName;
  }

  /**
   * Liệt kê các cơ sở dữ liệu hiện có
   * như lệnh show dbs trong mongo
   *
   */
  listDatabases() {
    return new Promise(async (rs, rj) => {
      try {
        if (this.client) {
          let dbList = await this.client.db().admin().listDatabases();
          let dbs = [];
          if (dbList) await dbList.databases.forEach((db) => dbs.push(db.name));
          rs(dbs);
        } else {
          rj("Database not Open for getListDatabase!");
        }
      } catch (e) {
        rj(e);
      }
    });
  }

  /**
   * Xóa bảng csdl
   * @param {*} dbName
   */
  dropDatabase(dbName) {
    if (dbName !== "admin" && this.client.isConnected()) {
      return this.client.db(dbName).dropDatabase();
    } else
      return new Promise((rs, rj) =>
        rj("Do not permission for drop database!")
      );
  }

  // table name
  /**
   * Tạo bảng lưu kiểu capped
   * Nếu bảng bình thường thì chèn trực tiếp sẽ ra bảng
   * @param {*} tableName
   * @param {*} jsonStructure   // Cau truc cua bang
   * @param {*} size            // kích cỡ cực đại tính bằng byte của một bảng (collection) nếu vượt quá thì bảng ghi cũ sẽ bị ghi đè nếu đặt capped=true
   * @param {*} max             // số bảng ghi (document) cực đại chứa trong bảng (collection)
   */
  createTable(tableName, jsonStructure, size, max) {

    return new Promise((rs, rj) => {
      this.db.listCollections({ name: tableName }).toArray(async (err, tbs) => {
        if (err) {
          rj(err)
          return;
        }
        // neu co bang thi xem nhu da tao duoc
        if (tbs && tbs.length > 0) {
          rs(tbs[0])
          return;
        }
        // chua co bang thi tao bang
        try {
          let rslt = await this.db.createCollection(tableName, {
            capped: size ? true : false, // kiểu dữ liệu ghi giới hạn, và quay tròn, không cần xóa nếu để true
            size: size || undefined,
            max: max || undefined,
          });

          // neu co cau truc bang thi ktra va tao index đơn lẻ
          for (let key in jsonStructure) {
            let el = jsonStructure[key]
            // nếu cột nào là index đơn lẻ thì tạo kiểu này
            if (el && (el.primaryKey || el.isUnique || el.isIndex)) {
              // console.log("Field index unique??", `--${key}--`, el.primaryKey || el.isUnique);
              await this.createIndex(tableName, Object.defineProperty({}, key.trim(), { value: 1, writable: true, enumerable: true, configurable: true, }), el.primaryKey || el.isUnique)
            }
            // nếu cột nào có uniqueKeyMulti = orm_unique_multi thì phải tạo kiểu index nhiều cột 
            if (el && (el.uniqueKeyMulti)) { // = "table_name, field_name"
              let fields = el.uniqueKeyMulti.split(",").map(x => x.trim())
              let indexFields = {}
              for (let field of fields) {
                Object.defineProperty(indexFields, field.trim(), { value: 1, writable: true, enumerable: true, configurable: true, })
              }
              await this.createIndex(tableName, indexFields, true)
            }
            // nếu có cột là el.foreignKey orm_foreign_key thì khai báo contraint foreign key
            //....
          }
          rs(rslt)
        } catch (e) {
          rj(e)
        }
      });
    })


  }

  /**
   * Liệt kê tất cả các bảng - collections trong database
   * @param {*} dbName
   */
  listTables(dbName) {
    if (this.client.isConnected()) {
      if (dbName) return this.client.db(dbName).listCollections().toArray();
      else return this.db.listCollections().toArray();
    } else {
      return new Promise((rs, rj) => rj("Database not open for listTabses!"));
    }
  }

  /**
   * Xóa bản dữ liệu để tạo lại
   * @param {*} tableName
   */
  dropTable(tableName) {
    return this.db.dropCollection(tableName);
  }

  /**
   *
   * @param {*} tableName
   * @param {*} listKeys { "key1" : 1 , "a.keyx" : 1 }
   * @param {*} isUnique boolean
   */
  createIndex(tableName, listKeys, isUnique) {
    return new Promise(async (rs, rj) => {
      if (this.isOpen) {
        try {
          let rtn = await this.db
            .collection(tableName)
            .createIndex(listKeys, { unique: isUnique });
          rs(rtn);
        } catch (e) {
          rj(e);
        }
      } else rj("Database not Open for createIndex!");
    });
  }

  /**
   * Chèn một bảng ghi jsonData vào 1 bảng. Nếu bảng chưa có nó sẽ tự tạo bảng
   * Dữ liệu vào là json thường
   * @param {*} tableName
   * @param {*} jsonData
   */
  insert(tableName, jsonData) {
    return new Promise(async (rs, rj) => {
      if (this.isOpen) {
        try {
          let rtn = await this.db.collection(tableName).insertOne(jsonData);
          rs(rtn.result);
        } catch (e) {
          rj(e);
        }
      } else rj("Database not Open for insert!");
    });
  }

  /**
   * Chèn một mảng mới vào csdl
   * @param {*} tableName
   * @param {*} jsonArray
   */
  inserts(tableName, jsonArray) {
    return new Promise(async (rs, rj) => {
      if (this.isOpen) {
        try {
          let rtn = await this.db.collection(tableName).insertMany(jsonArray);
          rs(rtn.result);
        } catch (e) {
          rj(e);
        }
      } else rj("Database not Open for inserts!");
    });
  }

  /**
   * Update một bảng ghi đầu tiên tìm thấy theo mệnh đề where
   * jsonOption = {
     upsert: <boolean>,
     writeConcern: <document>,
     collation: <document>,
     arrayFilters: [ <filterdocument1>, ... ],
     hint:  <document|string>        // Available starting in MongoDB 4.2.1
   }
   * @param {*} tableName 
   * @param {*} jsonWhere 
   * @param {*} jsonData 
   * @param {*} jsonOption 
   */
  update(tableName, jsonWhere = {}, jsonData = {}, jsonOption = {}) {
    return new Promise(async (rs, rj) => {
      if (this.isOpen) {
        try {
          let rtn = await this.db
            .collection(tableName)
            .updateOne(jsonWhere, { $set: { ...jsonData } }, jsonOption);
          rs(rtn.result);
        } catch (e) {
          rj(e);
        }
      } else rj("Database not Open for update!");
    });
  }

  /**
   * Cập nhật tất cả bảng ghi tìm thấy đúng điều kiện lọc, như 1 bảng ghi ở trên
   * @param {*} tableName
   * @param {*} jsonWhere
   * @param {*} jsonData
   * @param {*} jsonOption
   */
  updates(tableName, jsonWhere = {}, jsonData = {}, jsonOption = {}) {
    return new Promise(async (rs, rj) => {
      if (this.isOpen) {
        try {
          let rtn = await this.db
            .collection(tableName)
            .updateMany(jsonWhere, { $set: { ...jsonData } }, jsonOption);
          rs(rtn.result);
        } catch (e) {
          rj(e);
        }
      } else rj("Database not Open for updates!");
    });
  }

  /**
   * Xóa một bảng ghi đầu tiên
   * {
      writeConcern: <document>,
      collation: <document>,
      hint: <document|string>        // Available starting in MongoDB 4.4
   }
   * @param {*} tableName 
   * @param {*} jsonWhere 
   * @param {*} jsonOption 
   */
  delete(tableName, jsonWhere = {}, jsonOption = {}) {
    return new Promise(async (rs, rj) => {
      if (this.isOpen) {
        try {
          let rtn = await this.db
            .collection(tableName)
            .deleteOne(jsonWhere, jsonOption);
          rs(rtn.result);
        } catch (e) {
          rj(e);
        }
      } else rj("Database not Open for delete!");
    });
  }

  /**
   * Xóa tất cả các bảng ghi
   * @param {*} tableName
   * @param {*} jsonWhere
   * @param {*} jsonOption
   */
  deletes(tableName, jsonWhere = {}, jsonOption = {}) {
    return new Promise(async (rs, rj) => {
      if (this.isOpen) {
        try {
          let rtn = await this.db
            .collection(tableName)
            .deleteMany(jsonWhere, jsonOption);
          rs(rtn.result);
        } catch (e) {
          rj(e);
        }
      } else rj("Database not Open for deletes!");
    });
  }

  /**
   * jsonWhere tra cứu cấu trúc lệnh collection.find() trong mongo
   * jsonSort tra cứu cấu trúc lệnh Cursor.sort() trong mongo
   * @param {*} tableName Tên bảng để lấy dữ liệu
   * @param {*} jsonFields chỉ lọc những trường dữ liệu trả về thôi { a: 1 } | { _id: 0, a: 1 }
   * @param {*} jsonWhere Mệnh đề where {a:"test"} | { a: { $gt:"1"} } | { a: { $regex: /^t/ } } | { a: {$in: [ "cũ", "1" ]} }
   * @param {*} jsonSort  Mệnh đề sắp xếp { a: 1 } => 1 = A-Z, -1 = Z-A
   */
  select(tableName, jsonWhere = {}, jsonFields = {}, jsonSort = {}) {
    return new Promise(async (rs, rj) => {
      if (this.isOpen) {
        try {
          let rst = await this.db
            .collection(tableName)
            .findOne(jsonWhere || {}, {
              sort: jsonSort,
              projection: jsonFields,
            });
          rs(rst);
        } catch (e) {
          rj(e);
        }
      } else rj("Database not Open for select!");
    });
  }

  /**
   * jsonWhere tra cứu cấu trúc lệnh collection.find() trong mongo
   * jsonSort tra cứu cấu trúc lệnh Cursor.sort() trong mongo
   * @param {*} tableName Tên bảng để lấy dữ liệu
   * @param {*} jsonFields chỉ lọc những trường dữ liệu trả về thôi { a: 1 } | { _id: 0, a: 1 }
   * @param {*} jsonWhere Mệnh đề where {a:"test"} | { a: { $gt:"1"} } | { a: { $regex: /^t/ } } | { a: {$in: [ "cũ", "1" ]} }
   * @param {*} jsonSort  Mệnh đề sắp xếp { a: 1 } => 1 = A-Z, -1 = Z-A
   */
  selectAll(tableName, jsonWhere = {}, jsonFields = {}, jsonSort = {}) {
    return new Promise(async (rs, rj) => {
      if (this.isOpen) {
        try {
          let cursor = await this.db
            .collection(tableName)
            .find(jsonWhere || {}, { sort: jsonSort, projection: jsonFields });
          // if (jsonSort) cursor = await cursor.sort(jsonSort)
          var rtn = await cursor.toArray();
          rs(rtn);
        } catch (e) {
          rj(e);
        }
      } else rj("Database not Open for selects!");
    });
  }

  /**
   * Lấy bảng ghi đầu chèn vào đầu tiên
   * @param {*} tableName
   * @param {*} jsonWhere
   * @param {*} jsonFields
   */
  getFirstRecord(tableName, jsonWhere = {}, jsonFields = {}, fieldOrder) {
    let jsonSort = { $natural: 1 }
    if (fieldOrder)
      jsonSort = Object.defineProperty({}, fieldOrder, {
        value: 1,
        writable: true,
        enumerable: true,
        configurable: true,
      })
    return this.select(tableName, jsonWhere, jsonFields, jsonSort);
  }

  /**
   * Lấy bảng ghi chèn vào sau cùng
   * @param {*} tableName
   * @param {*} jsonWhere
   * @param {*} jsonFields
   */
  getLastRecord(tableName, jsonWhere = {}, jsonFields = {}, fieldOrder) {
    let jsonSort = { $natural: -1 }
    if (fieldOrder)
      jsonSort = Object.defineProperty({}, fieldOrder, {
        value: -1, writable: true,
        enumerable: true,
        configurable: true,
      })
    return this.select(tableName, jsonWhere, jsonFields, jsonSort)
  }
}

module.exports = MongoDAO;
