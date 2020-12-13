const DataType = require("./data-type");
/**
 * là kiểu logic như kiểu đúng = YES, TRUE, ON sai = NO, FALSE, OFF
 * Ta có thể tự gán vào giá trị là chuỗi true, false trực tiếp hoặc on, off trực tiếp
 */
class BOOLEAN extends DataType {
  constructor() {
    super({
      js: DataType.mapType().BOOLEAN[0],
      sqlite: DataType.mapType().BOOLEAN[1],
      oracle: DataType.mapType().BOOLEAN[2],
      mongodb: DataType.mapType().BOOLEAN[3],
    });
  }

  /**
   * Tự chuyển nếu không đưa giá trị vào thì = 0, nếu đưa vào mà là string thì đổi chữ false=0, còn lại là 1
   * Nếu không đưa giá trị thì mặt định là 0
   * nếu gán vào là chuỗi có chữ off, false, hoặc <=0 thì ghi là = 0
   * Còn lại là 1
   * @param {*} value
   * @param {*} dbType
   */
  getTrueData(value, dbType) {
    // nếu không định nghĩa thì trả về không định nghĩa
    if (value === undefined || value === null) return undefined;

    // nếu không có giá trị thì trả về false = 0
    if (!value) return 0;

    if (typeof value === "string") {
      if (!value.replace(/\s/g, "")) {
        return 0;
      }
      if (value.replace(/\s/g, "").toLocaleLowerCase() === "false" ||
        value.replace(/\s/g, "").toLocaleLowerCase() === "off") {
        return 0;
      }
      if (parseInt(value) <= 0) {
        return 0;
      }
    }

    if (typeof value === "number" && value <= 0) {
      return 0;
    }

    return 1;

  }


  /**
   * 
   * @param {*} value 
   * @param {*} dbType 
   */
  getTrueDataWhere(value, dbType) {
    // nếu không định nghĩa thì trả về không định nghĩa
    if (value === undefined || value === null) return undefined;

    // nếu là mệnh đề where:{id:{$like:...}}  thì trả về nguyên gốc
    if (typeof value === "object") {
      return value;
    }

    // nếu không có giá trị thì trả về false = 0
    if (!value) return 0;

    if (typeof value === "string") {
      if (!value.replace(/\s/g, "")) {
        return 0;
      }
      if (value.replace(/\s/g, "").toLocaleLowerCase() === "false" ||
        value.replace(/\s/g, "").toLocaleLowerCase() === "off") {
        return 0;
      }
      if (parseInt(value) <= 0) {
        return 0;
      }
    }

    if (typeof value === "number" && value <= 0) {
      return 0;
    }

    return 1;

  }
  
}
module.exports = new BOOLEAN();
