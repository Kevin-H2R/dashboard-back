import mariadb from 'mariadb'
import db_config from '../config/database.js'
const connection = mariadb.createPool({
  host: db_config.host,
  user: db_config.user,
  password: db_config.password,
  database: db_config.name
})
 export default connection
