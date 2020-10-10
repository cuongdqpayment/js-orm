// chuyển đổi mệnh đề where có các mệnh đề $like và $null không phù hợp với mongodb
module.exports = (jsonWhere) => {
    let newWhere = JSON.parse(JSON.stringify(jsonWhere),
        (key, value) => {
            if (value !== null && typeof value === "object" && !Array.isArray(value)) {
                // duyệt hết các mệnh đề lấy $key trong value
                let newValue = { ...value };
                for (let k in value) {
                    let v = value[k];
                    switch (k) {
                        case "$like":
                            // chuyển đổi $like:"*m" thành mệnh đề $regex:/.*m/g
                            newValue["$regex"] = new RegExp(`^${v.replace(/\*/g, '.*')}$`, "g");
                            break;
                        case "$null":
                            // chuyển đổi mệnh đề $null:true thành $exists:false
                            newValue["$exists"] = !v;
                            break;
                        default:
                            break;
                    }
                }
                // xóa các mệnh đề mà mongo không hiểu trong where
                delete newValue["$like"];
                delete newValue["$null"];
                return newValue;
            }
            return value;
        })

    // console.log("NN", newWhere);
    return newWhere;
}