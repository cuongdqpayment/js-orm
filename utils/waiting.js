/**
 * Hàm đợi khi nào có dữ liệu hoặc sau thời gian timeout sẽ thoát promise
 * Cách sử dụng:
 * Khai báo hàm promise waiting như sau:
 * let { waiting } = require("../../utils");
 * 
 * hoặc:
 * 
 * let waiting = require("../../utils").waiting
 * 
 * khai báo đợi:
 * 
 * waiting(<số giây timeout>, {hasData: () => <lấy biến mong đợi có kết quả trước thời gian timeout>})
 * .then(timeoutMsg=>{ console.log('Đã xong', timeoutMsg) })
 * 
 * hoặc:
 * 
 * let timeoutMsg = wait waiting(<số giây timeout>, {hasData: () => <lấy biến mong đợi có kết quả trước thời gian timeout>})
 * 
 * Sau đó là bước tiếp theo để làm việc
 }) 
 * 
 */
module.exports = (timeout, obj) =>
  new Promise((rs) => {
    var milisecond = timeout || 10000;
    let startTime = Date.now();
    let intervalObj = setInterval(() => {
        // console.log(obj.hasData());
      if (obj.hasData() || Date.now() - startTime > milisecond) {
        clearInterval(intervalObj);
        intervalObj = null;
        rs(obj.hasData ? "" : `Exit with timeout ${milisecond}`);
      }
    }, 1000);
  });
