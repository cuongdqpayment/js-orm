// Test thử gọi hàm nếu không khai báo biến url thì phun lỗi, và tự nhảy xuống errors
// const url = require('url');
module.exports = {
    test: (req, res) => {
        try {
            let path = decodeURIComponent(url.parse(req.url, true, false).pathname);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>Trang test : ' + req.clientIp + '</h1><br>' + path);
        } catch (e) {
            throw 'Loi test gui!:' + e;
        }
    }
    ,
    // Hàm trả về lỗi không xác định trong node nếu phát sinh lỗi xử lý tránh stop service
    errors: (err, req, res) => {
        if (err && err.code && err.message) {
            res.writeHead(err.code, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('Error ' + err.message);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('Error unkow: ');
        }
    }
}