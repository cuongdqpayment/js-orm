"use strict"

/**
 * 
 * ver 4.0 thêm các hàm chuyển đổi tiếng việt không dấu và xóa ký tự xuống dòng để ghi ra text
 * 
 * ver 3.0 đọc đầy đủ nghìn tỷ đồng
 * 
 * ver 2.0 đọc số tiền âm như tiền dương
 * thêm tiếp đầu ngữ là âm
 * 
 * ver 1.5 bỏ base64
 * 
 * version 1.4
 * 06/05/2019 - cuongdq
 *
 * doc so tien tieng viet
 * chuyen doi chu hoa Ho Va Ten
 * Chuyen doi string to Directory Base64
 * Chuyen doi string Ho Va Ten sang first_name and last_name
 *
 * De su dung:
 * import Converter from '../utils/vietnamese-handler'
 * 
 */


 // chuyển tiếng việt utf-8 thành không dấu
const convertVietnamese2None = (str) => {
    let v_non_unicode = `aadeoouAADEOOUaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiooooooooooooooouuuuuuuuuuyyyyyAAAAAAAAAAAAAAAEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOUUUUUUUUUUYYYYY`.split("")
    let v_unicode_build_in = `ăâđêôơưĂÂĐÊÔƠƯàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹÀÁẠẢÃẰẮẶẲẴẦẤẬẨẪÈÉẸẺẼỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕỒỐỘỔỖỜỚỢỞỠÙÚỤỦŨỪỨỰỬỮỲÝỴỶỸ`.split("")
    if (typeof str !== "string") return "";
    for (let i = 0; i < v_unicode_build_in.length; i++) {
        str = str.replace(new RegExp(v_unicode_build_in[i], "g"), v_non_unicode[i])
    }
    return str;
}

// xóa các ký tự xuống dòng cho text, và xóa các thẻ tag <>, #, $, và các ký tự đặc biệt
// loại bỏ các từ đệm (option)
const convertPlainText = (str) => {
    let v_none_chars = `,'"!-_{}`.split("")
    if (typeof str !== "string") return "";
    str = str.replace(/\r?\n|\r/g, '')  // xóa các ký tự xuống dòng
    for (let i = 0; i < v_none_chars.length; i++) {
        str = str.replace(new RegExp(v_none_chars[i], "g"),' ')
    }
    return str;
}

const mangso = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

const dochangchuc = (so, daydu) => {
    let chuoi = "";
    const chuc = Math.floor(so / 10);
    const donvi = so % 10;
    if (chuc > 1) {
        chuoi = " " + mangso[chuc] + " mươi";
        if (donvi == 1) {
            chuoi += " mốt";
        }
    } else if (chuc == 1) {
        chuoi = " mười";
        if (donvi == 1) {
            chuoi += " một";
        }
    } else if (daydu && donvi > 0) {
        chuoi = " lẻ";
    }

    if (donvi == 5 && chuc >= 1) {
        chuoi += " lăm";
    } else if (donvi > 1 || (donvi == 1 && chuc == 0)) {
        chuoi += " " + mangso[donvi];
    }
    return chuoi;
}

const docblock = (so, daydu) => {
    let chuoi = "";
    const tram = Math.floor(so / 100);
    so = so % 100;
    if (daydu || tram > 0) {
        chuoi = " " + mangso[tram] + " trăm";
        chuoi += dochangchuc(so, true);
    } else {
        chuoi = dochangchuc(so, false);
    }
    return chuoi;
}

const dochangtrieu = (so, daydu) => {
    let chuoi = "";
    const trieu = Math.floor(so / 1000000);
    so = so % 1000000;
    if (trieu > 0) {
        chuoi = docblock(trieu, daydu) + " triệu";
        daydu = true;
    }
    const nghin = Math.floor(so / 1000);
    so = so % 1000;
    if (nghin > 0) {
        chuoi += docblock(nghin, daydu) + " nghìn";
        daydu = true;
    }
    if (so > 0) {
        chuoi += docblock(so, daydu);
    }
    return chuoi;
}
const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(1).toUpperCase() + s.slice(2)
}
const StringVietnamDong = (sodauvao) => {
    let so = sodauvao
    if (so == 0) return mangso[0];
    if (so < 0) return "Âm " + StringVietnamDong(Math.abs(so));
    if (so > 8999999999999999) return "Số quá lớn!";
    let chuoi = ""
    let hauto = ""
    do {
        const ty = so % 1000000000;
        so = Math.floor(so / 1000000000);
        if (so > 0) {
            chuoi = dochangtrieu(ty, true) + hauto + chuoi;
        } else {
            chuoi = dochangtrieu(ty, false) + hauto + chuoi;
        }
        hauto = " tỷ";
    } while (so > 0);
    const upChuoi = capitalize(chuoi)
    return upChuoi + " đồng ./";
}


const InitCapString = (str) => {
    str = str.split(" ");
    let returnStr = "";
    for (var i = 0, x = str.length; i < x; i++) {
        if (str[i]) returnStr += (returnStr ? " " : "") + str[i][0].toUpperCase() + str[i].substr(1);
    }
    return returnStr;
}

const splitFullName = (fullname) => {
    if (!fullname) return null;
    let name = fullname.trim();
    if (!name) return null;
    return {
        last_name: InitCapString(name.split(' ').slice(0, -1).join(' ')),
        first_name: InitCapString(name.split(' ').slice(-1).join(' '))
    }
}

module.exports = {
    StringVietnamDong: StringVietnamDong, // Đọc số ra chữ bằng tiền
    InitCapString: InitCapString, // Viết tất cả các chữ hoa đầu
    convertVietnamese2None: convertVietnamese2None, // 
    convertPlainText: convertPlainText,             // 
    splitFullName: splitFullName  // Tách tên và họ
};

//console.log(StringVietnamDong(13445555));
