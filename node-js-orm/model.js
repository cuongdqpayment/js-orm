/**
 * 5.0 Thay đổi update/updates, delete/deletes
 * Để thực hiện update/delete cho 1 bảng ghi, nhiều bảng ghi phù hợp với API cung cấp ra bên ngoài
 * Hạn chế các thao tác update/delete làm hỏng dữ liệu
 *
 * 4.5 ngày 10/10/2020
 * Bổ sung các mệnh đề $lt,$gt,$in
 *
 * Đây là đối tượng giao tiếp model CRUD chứa các phương thức tạo ra mô hình bất kỳ
 * Nó tương đương một bảng trong csdl, có thể lấy 1 bảng ghi
 * Chứa thông tin cấu trúc dữ liệu giao tiếp giữa form và giữa csdl
 *
 * Chức năng của nó là biến đổi kiểu dữ liệu khai báo của người dùng
 * thành các kiểu dữ liệu tương ứng theo từng csdl. Ví dụ: STRING = TEXT của sqlite3 = VARCHAR(2000) của oracle
 *
 * Nó hỗ trợ các phương thức tạo bảng (để migrate dữ liệu từ csdl này sang csdl khác hoặc tạo csdl từ excel)
 *
 * Nó hỗ trợ chức năng insert, update, delete và select csdl
 *
 * Nó hỗ trợ chức năng kiểm tra xác nhận trước kiểu dữ liệu hợp lệ với định nghĩa mô hình không?
 *
 * Và nó chỉ lọc lấy những dữ liệu đã được định nghĩa theo mô hình, còn các trường khác sẽ bị loại bỏ (thừa)
 *
 * Các ràng buộc dữ liệu không xử lý ở đây, mà chỉ csdl sẽ xử lý để đơn giản hóa khâu này
 *
 * fix true data ok 2020-09-10
 */

// kiểu csdl để validate
const { SQLiteDAO, OracleDAO, MongoDAO } = require("./database");
// kiểu dữ liệu để validate
const dataTypes = require("./data-types");

/**
 * CRUD Model in ORM so easy for you!
 */
class Model {
  /**
     * ex: 
     * {
     * id: {
            type: DataTypes.INTEGER,
            notNull: true,
            primaryKey: true,
            autoIncrement: true,
            length: 100
        },
        username: {
            type: DataTypes.STRING,
            notNull: true,
            isUnigue: true,
            length: 100
        },
        fullname: DataTypes.STRING,
        role: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
     * }
     * @param {*} database = NodeDatabase instance | tương tác db nào
     * @param {*} tbName = tableName or documentName not null | tên bảng tương ứng trong csdl
     * @param {*} jsonDefine = define of table for any database framwork or null for CRUD | định nghĩa cấu trúc ràng buộc, tạo bảng 
     */
  constructor(database, tbName, jsonDefine) {
    // gán cấu trúc của mô hình được định nghĩa nơi đây
    this.tableStructure = jsonDefine;
    // lọc các danh mục các trường xác định unique để phục vụ cho mệnh đề update theo unique
    // danh mục các trường khóa chính của mô hình (primary_key, is_unique, unique_multi)
    // this.uniqueKeys = { primary_key: "id", is_unique: ["id"], unique_multi:["id", "key"]};
    this.uniqueKeys = { is_unique: [], unique_multi: [] };
    for (let key in jsonDefine) {
      let dataType = jsonDefine[key];
      if (typeof dataType === "object") {
        if (dataType.primaryKey) {
          this.uniqueKeys.primary_key = key;
        }
        if (dataType.isUnique) {
          this.uniqueKeys.is_unique.push(key);
        }
        if (
          dataType.uniqueKeyMulti &&
          typeof dataType.uniqueKeyMulti === "string"
        ) {
          this.uniqueKeys.unique_multi.splice(
            0,
            0,
            ...dataType.uniqueKeyMulti.split(",").map((x) => x.trim())
          );
        }
      }
    }

    this.db = database;
    this.tableName = tbName;
    this.dbType = dataTypes.DataType.mapType().dbTypes[0]; // js
    if (this.db.getDbInstance() instanceof SQLiteDAO)
      this.dbType = dataTypes.DataType.mapType().dbTypes[1];
    if (this.db.getDbInstance() instanceof OracleDAO)
      this.dbType = dataTypes.DataType.mapType().dbTypes[2];
    if (this.db.getDbInstance() instanceof MongoDAO)
      this.dbType = dataTypes.DataType.mapType().dbTypes[3];
  }

  /**
   * Trả về cấu trúc được định nghĩa của model
   * Phục vụ cho việc định nghĩa bằng tay, từ excel khai báo
   */
  getStructure() {
    return JSON.stringify(
      this.tableStructure,
      (key, value) => {
        if (key === "type" || value === "" || value === null) return undefined;
        return value;
      },
      2
    );
  }

  /**
   * Trả về các tên trường unique để update
   */
  getUniques() {
    return this.uniqueKeys;
  }

  /**
   * Trả về tên csdl ghép giữa type#databasename
   */
  getDbName() {
    return this.db ? this.db.getDbName() : "";
  }

  /**
   * Trả về tên mô hình để biết mô hình thuộc bảng dữ liệu nào
   */
  getName() {
    return this.tableName;
  }

  /**
   * Trả db của chính nó
   */
  getDb() {
    return this.db;
  }

  /**
   * Tạo bảng nếu chưa có, hoặc lấy dữ liệu về
   * @param {*} jsonWhere
   * @param {*} jsonFields
   */
  sync(jsonWhere = {}, jsonFields = {}) {
    // nếu có định nghĩa bảng thì khai báo tạo bảng nếu không thì chỉ ktra có bảng chưa thôi
    if (!this.tableStructure) {
      return this.db.selectOne(this.tableName, jsonWhere, jsonFields);
    }
    // console.log(`Tạo bảng ${this.tableName} với cấu trúc`, this.convertDataTypes(this.tableStructure));
    // nếu là csdl sqlite thì kiểu dữ liệu STRING tương đương là TEXT, còn oracle tương đương là VARCHAR2(2000), còn mongodb thì kiểu bất kỳ
    return this.db.createTable(
      this.tableName,
      this.convertDataTypes(this.tableStructure)
    );
  }

  /**
   * Chèn một bảng ghi mới vào csdl - trường hợp chèn nhiều thì sử dụng phương thức chèn nhiều trong chức năng import
   * @param {*} jsonData
   */
  async create(jsonData) {
    // validate dữ liệu jsonData có ràng buộc như yêu cầu không
    try {
      let jsonFilter = this.validFilter(jsonData);
      let jsonDaoDataAutoIncrement = await this.checkAutoIncrement(jsonFilter);
      let jsonDaoData = this.convertTrueData(jsonDaoDataAutoIncrement);
      // kiểm tra nếu lỗi thì trả về mã lỗi và câu sql gốc
      return this.db.insertOne(this.tableName, jsonDaoData)
      .catch((error) => {
        throw {
          data: jsonData,
          error,
        };
      });
    } catch (e) {
      return this.errorPromise(e);
    }
  }

  /**
   * Lấy bảng ghi theo mệnh đề where
   * @param {*} jsonWhere
   * @param {*} jsonFields
   * @param {*} jsonSort
   */
  read(jsonWhere = {}, jsonFields = {}, jsonSort = {}) {
    // let jsonWhereTrueData = this.convertTrueData(jsonWhere);
    return this.db.selectOne(
      this.tableName,
      this.convertTrueDataWhere(jsonWhere),
      jsonFields,
      jsonSort
    );
  }

  /**
   * Lấy toàn bộ bảng ghi theo mệnh đề where
   * @param {*} jsonWhere  // ex: {id: 5, status: "OFF"} = where id = 5 and status = 'OFF'
   * @param {*} jsonFields // ex: {id:1,field:1} = select id, field from ...
   * @param {*} jsonSort   // ex: {id: -1} = order by id desc
   * @param {*} jsonPaging // ex: {limit:10 , offset:5}
   */
  readAll(jsonWhere = {}, jsonFields = {}, jsonSort = {}, jsonPaging = {}) {
    return this.db.selectAll(
      this.tableName,
      this.convertTrueDataWhere(jsonWhere),
      jsonFields,
      jsonSort,
      jsonPaging
    );
  }

  /**
   * Chỉ đọc số liệu bảng ghi trong một bảng
   * @param {*} jsonWhere
   */
  readCount(jsonWhere = {}) {
    return this.db.selectCount(
      this.tableName,
      this.convertTrueDataWhere(jsonWhere)
    );
  }

  /**
   * Truy vấn số lượng bảng ghi của một trang
   * Dữ liệu đầu vào là
   * @param {*} jsonWhere
   * @param {*} jsonFields
   * @param {*} jsonSort
   * @param {*} jsonPage { page , limit, total}
   */
  readPage(jsonWhere = {}, jsonFields = {}, jsonSort = {}, jsonPage = {}) {
    let { limit, total, page } = jsonPage;
    const DEFAULT_LIMIT = 5; // mặt định là số bảng ghi là 5/trang
    try {
      limit = limit ? parseInt(limit) : DEFAULT_LIMIT;
      total = total ? parseInt(total) : undefined;
      page = page ? parseInt(page) : 1;
    } catch (e) {
      limit = DEFAULT_LIMIT;
      total = undefined;
      page = 1;
    }
    let offset = limit * (page - 1);
    if ((total && offset > total) || page <= 0) {
      return Promise.resolve({
        page,
        data: [],
        limit,
        next_page: 1,
        length: 0,
      });
    }
    return this.db
      .selectAll(
        this.tableName,
        this.convertTrueDataWhere(jsonWhere),
        jsonFields,
        jsonSort,
        {
          limit,
          offset,
        })
      .then((data) => {
        return {
          page,
          data,
          limit,
          next_page: data.length < limit ? 1 : page + 1,
          length: data.length,
        };
      });
  }

  /**
   *
   * @param {*} jsonData
   */
  update(jsonData, jsonWhere) {
    try {
      let jsonFilter = this.tableStructure
        ? this.validFilter(jsonData)
        : jsonData;
      return this.db
        .updateOne(this.tableName,
          jsonFilter,
          this.convertTrueDataWhere(jsonWhere)
        )
        .catch((error) => {
          throw {
            data: jsonData,
            error,
          };
        });
    } catch (e) {
      return this.errorPromise(e);
    }
  }

  /**
   * Update tất cả (mongodb phân biệt update 1 bảng ghi gặp đầu tiên thay vì update tất cả như DBMS thì không)
   * @param {*} jsonData
   * @param {*} jsonWhere
   */
  updateAll(jsonData, jsonWhere) {
    try {

      let jsonFilter = this.tableStructure
        ? this.validFilter(jsonData)
        : jsonData;

      return this.db
        .updateAll(
          this.tableName,
          jsonFilter,
          this.convertTrueDataWhere(jsonWhere)
        )
        .catch((error) => {
          throw {
            data: jsonData,
            error,
          };
        });
    } catch (e) {
      return this.errorPromise(e);
    }
  }

  /**
   * Xóa bảng ghi có mệnh đề where theo json
   * @param {*} jsonWhere
   * @param {*} jsonOption
   */
  delete(jsonWhere, jsonOption) {
    return this.db.deleteOne(
      this.tableName,
      this.convertTrueDataWhere(jsonWhere),
      jsonOption);
  }

  /**
   * Xóa tất cả như cũ (mongodb phân biệt xóa tất cả và xóa 1 bảng ghi nhưng DBMS thì không)
   * @param {*} jsonWhere
   * @param {*} jsonOption
   */
  deleteAll(jsonWhere, jsonOption) {
    return this.db.deleteAll(
      this.tableName,
      this.convertTrueDataWhere(jsonWhere),
      jsonOption);
  }

  /**
   * Kiểm tra và tự chèn giá trị tự sinh tăng lên khi csdl không hỗ trợ seq tự sinh
   * @param {*} jsonData
   */
  async checkAutoIncrement(jsonData) {
    if (!this.tableStructure) return jsonData;
    let filter = {
      ...jsonData,
    };
    for (let key in this.tableStructure) {
      let el = this.tableStructure[key];
      let value = jsonData[key];
      // trường hợp có định nghĩa trường tự sinh nhưng không gán giá trị
      if (el.autoIncrement && !value) {
        // kiểm tra csdl không hỗ trợ trường tự sinh tham số được thiết lập ở cấu hình
        // thì tự tạo giá trị ở đây theo seq (hoặc truy vấn csdl và lấy giá trị lớn nhất + 1)
        // trả về là max hoặc undefined
        let maxId = await this.db.getMaxIncrement(this.tableName, key);
        if (maxId >= 0) {
          filter[key] = maxId + 1;
        }
      }
    }
    return new Promise((rs) => rs(filter));
  }

  /**
   * Hàm chuyển đổi kiểu dữ liệu model sang kiểu dữ liệu của db tương ứng
   * @param {*} tableStructure
   */
  convertDataTypes(tableStructure) {
    let newConstructure = {};
    for (let key in tableStructure) {
      let el = tableStructure[key];
      if (el && el.type) {
        let newType = this.changeDbType(el.type, el.length);
        let newEl = { ...el };
        newEl.type = newType;
        newConstructure[key] = newEl;
      } else {
        newConstructure[key] = this.changeDbType(el);
      }
    }
    return newConstructure;
  }

  /**
   * Hàm chuyển đổi kiểu dữ liệu từ model sang kiểu dữ liệu thật
   * @param {*} type
   */
  changeDbType(type, length) {
    if (type.getRealType) return type.getRealType(this.dbType, length);
    return type;
  }

  // chuyển đổi kiểu dữ liệu phù hợp với csdl tương ứng
  convertTrueData(jsonData) {
    if (!this.tableStructure) return jsonData;
    let filter = {};
    for (let key in this.tableStructure) {
      let el = this.tableStructure[key];
      let value = jsonData[key];
      if (value !== undefined) {
        let trueData =
          el && el.type
            ? this.getTrueData(value, el.type)
            : this.getTrueData(value, el);
        filter[key] = trueData;
      }
    }
    return filter;
  }

  /**
   * Chuyển đổi kiểu dữ liệu thực cho mô hình để select, update, delete đúng mệnh đề where;
   * @param {*} jsonWhere 
   */
  convertTrueDataWhere(jsonWhere) {
    if (!this.tableStructure) return jsonWhere;
    let filter = {};
    for (let key in this.tableStructure) {
      let el = this.tableStructure[key];
      let value = jsonWhere[key];
      if (value !== undefined) {
        let trueData =
          el && el.type
            ? this.getTrueDataWhere(value, el.type)
            : this.getTrueDataWhere(value, el);
        filter[key] = trueData;
      }
    }
    return filter;
  }

  /**
   * Chuyển đổi giá trị thành trường dữ liệu thực đẩy vào DAO
   * như BOOLEAN => 0,1
   * DATE => `__$to_date`
   * DATETIME `__$to_date`...
   * Nếu kiểu INTEGER mà có kiểu dữ liệu là autoIncrement và csdl không hỗ trợ thì tự sinh id nhé
   * @param {*} value
   * @param {*} type
   */
  getTrueData(value, type) {
    return type && type.getTrueData
      ? type.getTrueData(value, this.dbType)
      : value;
  }


  /**
   * 
   * @param {*} value 
   * @param {*} type 
   */
  getTrueDataWhere(value, type) {
    return type && type.getTrueDataWhere
      ? type.getTrueDataWhere(value, this.dbType)
      : value;
  }

  // kiểm tra tính hợp lệ của dữ liệu
  // và chỉ lọc trả về các trường theo định nghĩa trước thôi
  validFilter(jsonData) {
    if (!this.tableStructure) return jsonData;
    let filter = {};
    for (let key in this.tableStructure) {
      let el = this.tableStructure[key];
      let value = jsonData[key];
      try {
        if (value !== undefined) {
          if (el && el.type) {
            this.checkValid(value, el.type, el);
          } else {
            this.checkValid(value, el);
          }
          filter[key] = value;
        }
      } catch (e) {
        throw `ERR-model: Field ${key} error with ${e}`;
      }
    }
    return filter;
  }

  /**
   * Kiểm tra tính hợp lệ kiểu dữ liệu
   * @param {*} value
   * @param {*} type
   * @param {*} opts
   */
  checkValid(value, type, opts) {
    // console.log(value, type, opts);
    try {
      if (type.isValid) return type.isValid(value, opts);
    } catch (e) {
      throw e;
    }
    return true;
  }

  // hàm trả về lỗi promise cho các thực thi bị sai
  errorPromise(e) {
    return Promise.reject(e || "Error with no db available!");
  }

}

module.exports = Model;
