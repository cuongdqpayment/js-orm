const moment = require('moment')
const toLocaleDateString = (date) => {
    return moment(date).format('DD/MM/YYYY');
}

const isValidMonth = (month) => {
    return moment(month, 'YYYY-MM', true).isValid()
}

const toOracleInputDate = (isoDate) => {
    const dateString = toLocaleDateString(isoDate).slice(0, 10)
    return `__$to_date('${dateString}', 'dd/mm/yyyy')`
}

module.exports = {
    toLocaleDateString,
    isValidMonth,
    toOracleInputDate
}