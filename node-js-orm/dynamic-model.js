/**
 * Lớp mô hình động hỗ trợ CRUD và cho 1 hoặc nhiều bảng ghi, trả tên csdl, cấu trúc mô hình
 * - import danh sách - không update
 * - import danh sách nếu lỗi thì update theo mệnh đề where
 * - import tự update theo mệnh đề where theo key đưa vào hoặc theo các trường primarykey, isUnique, uniqueMuilti
 *
 */

// định nghĩa chuyển csdl
const Model = require("./model");
const json2Model = require("./json-2-model");

// Định nghĩa khai báo một mô hình với csdl bằng mở rộng lớp mô hình từ thư viện và gọi lại thư viện
class DynamicModel extends Model {
  /**
   *
   * @param {*} db kết nối csdl theo mô hình model
   * @param {*} table_name tên bảng - trùng với mô hình json text cho model
   * @param {*} jsonTextModel - cấu hình orm text -
   */
  constructor(db, table_name, jsonTextModel) {
    // thực hiện khởi tạo mô hình lớp trên
    super(db, table_name, json2Model.jsonText2Model(jsonTextModel));
    // giao tiếp csdl Database theo mô hình (không phụ thuộc loại csdl)
    this.dbModel = db;
    // csdl DAO nguyên thủy sử dụng như các phương thức cũ (phải biết rõ đang sử dụng loại csdl nào để sử dụng lệnh phù hợp)
    this.dbDAO = db.getDbInstance();
  }

  // Danh sách các hàm mặt định của mô hình thuộc đối tượng Model gồm:
  /*
    - this.sync() = tạo bảng trong csdl
    - this.getStructure() = trả về cấu trúc thực của mô hình
    - this.getName() = trả về tên bảng của mô hình
    - this.getDb() = trả về csdl của mô hình đang kết nối (đối tượng database)
    - this.create() = insert - C
    - this.read()   = select - R
    - this.readAll() = select * or all from ... 
    - this.update() = update - U
    - this.updateAll() = update - U
    - this.delete() = delete - D
    - this.deleteAll() = delete - D
    - this.readCount() trả về số lượng bảng ghi của bảng theo mệnh đề where
    - this.readPage() = tương đương getPage()
     */

  //... Viết các phương thức riêng của mô hình ở đây
  /*
   * Hướng dẫn nhập liệu các mệnh đề where (clause):
   *
   * $lt <, nhỏ hơn
   * $lte <=, nhỏ hơn hoặc bằng
   * $gt >, lớn hơn
   * $gte >=, lớn hơn hoặc bằng
   * $ne !=, không bằng
   * $in [], nằm trong tập
   * $nin [], không nằm trong tập
   * $like [], giống với *x* = %x%
   * $null true/false, is null
   * $exists true/false is not null
   *
   * @param {*} jsonFields {field_name_1: 1 | 0, ...} for list field
   * @param {*} jsonSort = {field_name: 1 | -1} 1 for sort asc or -1 for sort desc
   * @param {*} jsonPage = {page, total, limit}
   */

  /**
   * Đếm số lượng bảng ghi sử dụng để phân trang tìm kiếm sau này
   * @param {*} jsonWhere
   */
  getCount(jsonWhere = {}) {
    return this.readCount(jsonWhere);
  }

  /**
   * Truy vấn theo trang dữ liệu {page, total, limit}
   * @param {*} jsonWhere {field_name:value | {$whereOperator:value},...}  or object of where clause
   *
   * Trả về {page, data:[]}
   */
  getPage(jsonWhere = {}, jsonFields, jsonSort, jsonPage) {
    return this.readPage(jsonWhere, jsonFields, jsonSort, jsonPage);
  }

  // phương thức đầu tiên là truy vấn toàn bộ dữ liệu có trong bảng
  /*
    // mệnh đề where được khai báo là key = tên cột, value bằng giá trị của mệnh đề where
    // nếu để trống thì tương đương select * from table;
    {},
    // khai báo liệt kê các cột dữ liệu cần hiển thị ở đây với key là tên trường và, giá trị là 1,
    ,{ id: 1,...}
     // mệnh đề sort fix from node-js-orm-1.1.3 trở lên
     // khai báo muốn sắp xếp cột nào, theo trật tự lớn đến bé = 1 hoặc bé đến lớn = -1
    ,{ id: -1 } 
    // mệnh đề phân trang, và giới hạn
    , {limit: 10, offset: 0}
    */
  getAllData(jsonWhere = {}, jsonFields, jsonSort, jsonPaging) {
    return this.readAll(jsonWhere, jsonFields, jsonSort, jsonPaging);
  }

  /**
   * Lấy 1 bảng ghi đầu tiên tìm thấy được theo mệnh đề where...
   * nếu ta đưa sắp xếp vào thì sẽ lấp bảng ghi đầu tiên
   *
   */
  getFirstRecord(jsonWhere = {}, jsonFields, jsonSort) {
    return this.read(jsonWhere, jsonFields, jsonSort);
  }

  /**
   * Chèn một bản ghi
   * @param {*} jsonData
   */
  insertOneRecord(jsonData) {
    return this.create(jsonData);
  }

  /**
   * Import một danh sách dữ liệu vào csdl, bảng ghi nào thành công thì ok, nếu không thành công thì bỏ qua và báo lỗi
   * @param {*} jsonRows  [{oneRow},...]
   */
  importRows(jsonRows = [], GROUP_COUNT = 100, isDebug = false) {
    if (
      !jsonRows ||
      !Array.isArray(jsonRows) ||
      jsonRows.filter((x) => Object.keys(x).length > 0).length === 0
    ) {
      return Promise.reject("No data for import");
    }

    return this.importArray2Database(
      jsonRows.filter((x) => Object.keys(x).length > 0),
      GROUP_COUNT,
      isDebug
    );
  }

  /**
   * Import danh sách mới, nếu trùng (hoặc lỗi - không cần biết lỗi gì - thì thực hiện update)
   * @param {*} jsonRows  [{oneRow},...]
   * @param {*} whereKeys ["id","table_name",...] nếu trùng thì sử dụng biến này để update
   */
  importRowsUpdates(
    jsonRows = [],
    whereKeys,
    GROUP_COUNT = 100,
    isDebug = false
  ) {
    if (
      !jsonRows ||
      !Array.isArray(jsonRows) ||
      jsonRows.filter((x) => Object.keys(x).length > 0).length === 0
    ) {
      return Promise.reject("No data for import");
    }

    return this.importArray2Database(
      jsonRows.filter((x) => Object.keys(x).length > 0),
      GROUP_COUNT,
      isDebug
    ).then(async (results) => {
      // đọc kết quả lấy trường rejects
      let updates;

      if (
        results &&
        results.rejects &&
        Array.isArray(results.rejects) &&
        results.rejects.length
      ) {
        // updates = { count_update: 0, count_fail: 0, rejects: [] };
        let arrUpdates = [];
        for (let reject of results.rejects) {
          if (reject && reject.reason && reject.reason.data) {
            arrUpdates.push(reject.reason.data);
          }
        }

        let arrWhereKeys = [];
        if (whereKeys && Array.isArray(whereKeys) && whereKeys.length) {
          arrWhereKeys = [...whereKeys];
        } else {
          arrWhereKeys = [
            this.getUniques().primary_key,
            ...this.getUniques().is_unique,
            ...this.getUniques().unique_multi,
          ];
        }

        // thực hiện update hàng loạt theo mệnh đề where hoặc sử dụng khóa chính, unique để update
        updates = await this.updateArray2Database(
          arrUpdates,
          arrWhereKeys,
          GROUP_COUNT,
          isDebug
        ).catch((err) => {
          console.log("updateArray2Database Error:", err);
        });
      }

      // trả lại kết quả import như cũ, thêm kết quả update hàng loạt theo mệnh đề
      return {
        ...results,
        updates,
      };
    });
  }

  /**
   * Thực hiện update toàn bộ bảng ghi (không insert mới)
   * @param {*} jsonRows
   * @param {*} whereKeys là mảng chứa các key update theo, nếu không đưa vào thì mặt định lấy các isUnique hoặc uniqueMulti làm key
   * @param {*} GROUP_COUNT
   * @param {*} isDebug
   */
  updateRows(jsonRows = [], whereKeys, GROUP_COUNT = 100, isDebug = false) {
    if (
      !jsonRows ||
      !Array.isArray(jsonRows) ||
      jsonRows.filter((x) => Object.keys(x).length > 0).length === 0
    ) {
      return Promise.reject("No data for import");
    }
    let arrWhereKeys = [];
    if (whereKeys && Array.isArray(whereKeys) && whereKeys.length) {
      arrWhereKeys = [...whereKeys];
    } else {
      if (this.getUniques().primary_key){
        arrWhereKeys.push(this.getUniques().primary_key);
      }
        arrWhereKeys = [
          arrWhereKeys,
          ...this.getUniques().is_unique,
          ...this.getUniques().unique_multi,
        ];
    }

    return this.updateArray2Database(
      jsonRows.filter((x) => Object.keys(x).length > 0),
      arrWhereKeys,
      GROUP_COUNT,
      isDebug
    );
  }

  /**
   * Cập nhập một bảng ghi đầu tiên
   * @param {*} jsonData
   * @param {*} jsonWhere
   */
  updateOneRecord(jsonData, jsonWhere) {
    return this.update(jsonData, jsonWhere);
  }

  /**
   * Xóa 1 bản ghi đầu tiên tìm thấy được
   * @param {*} jsonWhere
   */
  deleteOneRecord(jsonWhere) {
    return this.delete(jsonWhere);
  }

 
  /**
   * Một mô hình đã định nghĩa, một mảng dữ liệu đầu vào cần đưa vào csdl
   * @param {*} arrJson
   * @param {*} GROUP_COUNT
   * @param {*} isDebug
   */
  importArray2Database(arrJson, GROUP_COUNT = 100, isDebug) {
    if (!arrJson) {
      return Promise.reject(
        `Không khai báo đầy đủ các biến vào: arrJson hoặc không có dữ liệu để chèn`
      );
    }
    return new Promise(async (rs, rj) => {
      let result = {
        table_name: this.getName(),
        count_insert: 0,
        count_fail: 0,
        group_batch: GROUP_COUNT,
      };
      const rejects = [];
      for (let i = 0; i < arrJson.length; i += GROUP_COUNT) {
        const insertModels = arrJson.slice(i, i + GROUP_COUNT).map((row) => {
          // Mỗi đợt GROUP_COUNT chúng ta đưa vào mảng xử lý promise
          return this.create(row);
        });
        // insertModels sẽ có 100 hoặc ít hơn các promise đang chờ xử lý.
        // Promise.all sẽ đợi cho đến khi tất cả các promise
        // Promise.allSettled sẽ đợi cho đến khi tất cả các promise
        // thủ tục này yêu cầu nodejs từ 12.9 trở lên
        //đã được giải quyết và sau đó thực hiện 100 lần tiếp theo.
        let rslt = await Promise.allSettled(insertModels);
        if (rslt) {
          if (isDebug) console.log(`Kết quả chèn:`, rslt);
          // console.log(`Kết quả chèn thành công:`, rslt.map(x => x.status === "fulfilled"))
          // console.log(`Kết quả chèn thất bại:`, rslt.map(x => x.status === "rejected"))
          result.count_fail += rslt.filter(
            (x) => x.status === "rejected"
          ).length;
          result.count_insert += rslt.filter(
            (x) => x.status === "fulfilled"
          ).length;
          rejects.splice(
            rejects.length,
            0,
            ...rslt.filter((x) => x.status === "rejected")
          );
        }
      }
      rs({
        ...result,
        rejects,
      });
    });
  }

  /**
   * thực hiện import hàng loạt theo mệnh đề update sử dụng các khóa whereKeys
   * @param {*} arrJson
   * @param {*} whereKeys
   * @param {*} GROUP_COUNT
   * @param {*} isDebug
   */
  updateArray2Database(arrJson, whereKeys = [], GROUP_COUNT = 100, isDebug) {
    if (!arrJson) {
      return Promise.reject(
        `Không khai báo đầy đủ các biến vào arrJson hoặc không có dữ liệu để chèn`
      );
    }
    return new Promise(async (rs, rj) => {
      let result = {
        table_name: this.getName(),
        count_update: 0,
        count_fail: 0,
        group_batch: GROUP_COUNT,
      };
      const rejects = [];
      for (let i = 0; i < arrJson.length; i += GROUP_COUNT) {
        const updateModels = arrJson.slice(i, i + GROUP_COUNT).map((row) => {
          // Mỗi đợt GROUP_COUNT chúng ta đưa vào mảng xử lý promise
          let jsonData = {
            ...row,
          };
          let jsonWhere = {};
          for (let key of whereKeys) {
            if (jsonData[key] !== undefined) {
              // có khóa này trong json data thì khai báo cho mệnh đề where
              jsonWhere[key] = jsonData[key];
              jsonData[key] = undefined; // không update khóa where
            }
          }

          return this.update(jsonData, jsonWhere);
        });
        // updateModels sẽ có 100 hoặc ít hơn các promise đang chờ xử lý.
        // Promise.all sẽ đợi cho đến khi tất cả các promise
        // Promise.allSettled sẽ đợi cho đến khi tất cả các promise
        // thủ tục này yêu cầu nodejs từ 12.9 trở lên
        //đã được giải quyết và sau đó thực hiện 100 lần tiếp theo.
        let rslt = await Promise.allSettled(updateModels);
        if (rslt) {
          if (isDebug) console.log(`Kết quả chèn:`, rslt);
          // console.log(`Kết quả chèn thành công:`, rslt.map(x => x.status === "fulfilled"))
          // console.log(`Kết quả chèn thất bại:`, rslt.map(x => x.status === "rejected"))
          result.count_fail += rslt.filter(
            (x) => x.status === "rejected"
          ).length;
          result.count_update += rslt.filter(
            (x) => x.status === "fulfilled"
          ).length;
          rejects.splice(
            rejects.length,
            0,
            ...rslt.filter((x) => x.status === "rejected")
          );
        }
      }
      rs({
        ...result,
        rejects,
      });
    });
  }

  // ... Bạn có thể chèn vào các phương thức, hàm riêng để thao tác với cơ sở dữ liệu, để trả kết quả cho người dùng
  // ... xem thêm thư viện https://www.npmjs.com/package/node-js-orm hoặc vào thư viện gốc được cài đặt trên ./node-module để biết thêm các hàm giao tiếp khác
}

module.exports = DynamicModel;
