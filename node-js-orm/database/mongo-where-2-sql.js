/**
 * Hàm chuyển đổi mệnh đề where của mongo ra sql
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
        switch (key) {
            case "$in":
                if (Array.isArray(value)) {
                    if (iOut++ == 0) {
                        whereS +=
                            ` WHERE ${name} in ('${value.join("','")}')`;
                    } else {
                        whereS += ` AND ${name} in ('${value.join("','")}')`;
                    }
                }
                break;
            case "$lt":
                if (iOut++ == 0) {
                    whereS += ` WHERE ${name} < '${value}'`;
                } else {
                    whereS += ` AND ${name} < '${value}'`;
                }
                break;
            case "$lte":
                if (iOut++ == 0) {
                    whereS += ` WHERE ${name} <= '${value}'`;
                } else {
                    whereS += ` AND ${name} <= '${value}'`;
                }
                break;
            case "$gt":
                if (iOut++ == 0) {
                    whereS += ` WHERE ${name} > '${value}'`;
                } else {
                    whereS += ` AND ${name} > '${value}'`;
                }
                break;
            case "$gte":
                if (iOut++ == 0) {
                    whereS += ` WHERE ${name} >= '${value}'`;
                } else {
                    whereS += ` AND ${name} >= '${value}'`;
                }
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