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
    return !value
      ? 0
      : (typeof value === "string" &&
        !value.replace(/\s/g, "") && // trường hợp giá trị trống ở trước nhập vào thì trả về false nhé fix
        (value.toLocaleLowerCase() === "false" ||
          value.toLocaleLowerCase() === "off")) ||
        parseInt(value) <= 0
        ? 0
        : typeof value === "number" && value <= 0
          ? 0
          : 1;
  }
}
module.exports = new BOOLEAN();
