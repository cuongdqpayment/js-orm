/**
 * Bổ sung từ ver 2.0.6:
 * Hàm chuyển đổi mệnh đề where của mongo ra sql
 * 
 * Các hàm: $in, $nin, $lt, $gt, $lte, $gte, $ne, $like, $exists, $null
 * @param {*} name 
 * @param {*} operator 
 * @param {*} iIn 
 */
module.exports = (name, operator, iIn) => {
    let iOut = iIn || 0;
    // console.log("***", operator);
    let whereS = "";
    for (let key in operator) {
        let value = operator[key];
        // $like : "*5" => 
        switch (key) {
            case "$in":
                if (Array.isArray(value)) {
                    whereS += (iOut++ === 0 ? ` WHERE ` : ` AND `) + `${name} in ('${value.join("','")}')`;
                }
                break;
            case "$nin":
                if (Array.isArray(value)) {
                    whereS += (iOut++ === 0 ? ` WHERE ` : ` AND `) + `${name} not in ('${value.join("','")}')`;
                }
                break;
            case "$lt":
                whereS += (iOut++ === 0 ? ` WHERE ` : ` AND `) + `${name} < '${value}'`;
                break;
            case "$lte":
                whereS += (iOut++ === 0 ? ` WHERE ` : ` AND `) + `${name} <= '${value}'`;
                break;
            case "$gt":
                whereS += (iOut++ === 0 ? ` WHERE ` : ` AND `) + `${name} > '${value}'`;
                break;
            case "$gte":
                whereS += (iOut++ === 0 ? ` WHERE ` : ` AND `) + `${name} >= '${value}'`;
                break;
            case "$like":
                // thay thế tòa bộ dấu * thành dấu %
                let like = value ? value.replace(/\*/g, '%')  : `%`;
                whereS += (iOut++ === 0 ? ` WHERE ` : ` AND `) + `${name} like '${like}'`;
                break;
            case "$null":
                // is null
                let isNull = value ? `is null` : `is not null`;
                whereS += (iOut++ === 0 ? ` WHERE ` : ` AND `) + `${name} ${isNull}`;
                break;
            case "$ne":
                // not equal != or <> or is not null
                let notEqual = value===null ? `is not null` : `!= '${value}'`;
                whereS += (iOut++ === 0 ? ` WHERE ` : ` AND `) + `${name} ${notEqual}`;
                break;
            case "$exists":
                let exists = value ? `is not null` : `is null`;
                whereS += (iOut++ === 0 ? ` WHERE ` : ` AND `) + `${name} ${exists}`;
                break;
            default:
                break;
        }
    }
    return {
        whereS,
        iOut
    };
}