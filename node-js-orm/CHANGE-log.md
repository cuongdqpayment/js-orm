ver 3.1.8 fix Where in update and delete miss return Reject

ver 3.1.7 boolean " " === false

ver 3.1.6 boolean null === false

ver 3.1.5 fix deleteALL --> deleteAll

ver 3.1.4 fix loop for updateAll and deleteAll in dynamic-model.js

ver 3.1.3 fix where for update, select in database

ver 3.1.2 fix update and delete in SQLITE3 with rowid 

ver 3.1.1 fix OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY oracle 12c

ver 3.1.0 fix datatype for mongodb convert data with null

ver 3.0.9 fix table to jsonText in excel

ver 3.0.7 fix get this.uniqueKeys for multi

ver 3.0.6 fix circle for Dynamic-Model.js and excel2Database

ver 3.0.5 update where by unique field and DynamicModel in excel2Database

ver 3.0.4 updateRows and excell2Database.updateArray2Database

ver 3.0.3 importRowsUpdates ok

ver 3.0.1 change structure for update/updateAll, delete/deleteAll, select/selectAll - One and Many

ver 2.2.10 fix error data_type STRING = null ok

ver 2.2.9 add updates and deletes for model

ver 2.2.8 add db_type and db_name for listModels

ver 2.2.7 add listModels for create more models

ver 2.2.6 add modelConfig for create table for import models config

ver 2.2.5 add db.waitingConnected() return Promise

ver 2.2.4 fix create INDEX IF NOT EXISTS

ver 2.2.2 fix dbConnectionPool

ver 2.2.1 add dbConnectionPool

ver 2.2.0 add models dynamic for any models from client

ver 2.1.3 fix oracle return object and array - importArray2Database return rejects

ver 2.1.2 fix oracle connection for multi db

ver 2.1.1 return page for next page and length

ver 2.0.9 help for node-database to use in db not model

ver 2.0.8 fix log mongo waiting for connect db

ver 2.0.7 fix limit, page and total is integer for mongodb;

ver 2.0.6 add: $in, $nin, $lt, $gt, $lte, $gte, $ne, $like, $exists, $null
fix mongo for INTEGER for int and NUMBER for float

ver 2.0.5 page, count, $lt, $gt, $in

ver 2.0.0 add limit and offset for oracle 12 and mongodb, sqlite3

ver 1.1.22 create table with foreign_key in sqlite3

ver 1.1.21 fix bug import empty table && bug insert data

ver 1.1.16 make help use models

ver 1.1.15 fix create sqlite index

ver 1.1.12 static for method not parameter and boolean type for input string and number for =  null, undefine off, false, -1 is = 0 else 1

ver 1.1.11 fix data type boolean input number is not error

ver 1.1.8 fix create table PRIMARY_KEY in oracle 12 with AUTO INCREMENT

ver 1.1.3 fix sort for sqlite and oracle

ver 1.1.2 fix update on MongoDb for $set and many

ver 1.1.1 fix isDebug for SqliteDAO

ver 1.1.0 db.getRst(s) and db.runFunction

ver 1.0.9 include README demo

ver 1.0.7 fix bug dir for db sqlite

ver 1.0.5 fix bug model and json-2-model

ver 1.0.4 include test and excel