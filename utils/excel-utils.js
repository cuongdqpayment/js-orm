/**
 * 
 * 
 */
"use strict"
/////////////////////////////////////////
const patterns = {
    cell: /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/i
    , col: /([A-Z]+)$/i
    , row: /([0-9]+)$/i
}


// kiểm tra giá trị string có phải là cell của excel không?
const isCell = (str) => {
    if (str === null || str === undefined) return false;
    return str.search(patterns.cell) === 0 && str.search(patterns.row) > 0 && str.search(patterns.col) < 0
}

const isCol = (str) => {
    if (str === null || str === undefined) return false;
    return str.search(patterns.cell) < 0 && str.search(patterns.row) < 0 && str.search(patterns.col) === 0
}

const isRow = (str) => {
    if (str === null || str === undefined) return false
    return str.search(patterns.cell) < 0 && str.search(patterns.row) === 0 && str.search(patterns.col) < 0
}

// hàm chuyển đổi ký tự sang số cột trong bảng tính excel để cấu hình cột cho dễ nhớ
// console.log(['A', 'AA', 'AB', 'ZZ'].map(convertColExcel2Number)); // [1, 27, 28, 702]
const convertColExcel2Number = (val) => {
    var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, j, result = 0;
    for (i = 0, j = val.length - 1; i < val.length; i += 1, j -= 1) {
        result += Math.pow(base.length, j) * (base.indexOf(val[i]) + 1);
    }
    return result;
};

// hàm chuyển đổi ngược lại từ mã cột sang ký tự
const convertColExcel2String = (num) => {
    for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
        ret = String.fromCharCode(Math.floor((num % b) / a) + 65) + ret;
    }
    return ret;
};

// lấy giá trị thật nếu là công thức của excel
const getValueFormula = (obj) => {
    if (obj === null || obj === undefined) return null
    if (typeof obj === 'object') {
        // xử lý chuyển đổi chỉ lấy text thôi
        if (obj.richText) return obj.richText.map(o => o["text"]).join("")
        // lấy giá trị bằng biểu thức function
        return obj.result
    }
    return obj
}

module.exports = {
    isCell,
    isCol,
    isRow,
    convertColExcel2Number,
    convertColExcel2String,
    getValueFormula
};