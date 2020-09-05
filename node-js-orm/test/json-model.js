module.exports = {
    id: {
        type: "INTEGER",
        notNull: false,
        primaryKey: true,
        // foreignKey: undefined,
        autoIncrement: true,
        // isUnique: undefined,
        // uniqueMulti: undefined,
        length: 100,
        // defaultValue: undefined
    },
    username: {
        type: "STRING",
        notNull: false,
        isUnique: true,
        length: 100
    },
    nickname: {
        type: "STRING",
        notNull: false,
        length: 5
    },
    fullname: "STRING",
    role: {
        type: "NUMBER",
        defaultValue: 1
    },
    birth_date: "DATE",
    log_time: "TIMESTAMP",
    status: "BOOLEAN"
}