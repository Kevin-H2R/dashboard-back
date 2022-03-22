import db_config from '../config/database.js'
import mariadb from 'mariadb';
// import { query } from 'express';

// here we create a new connection pool
const pool = mariadb.createPool({
  host: db_config.host, 
  user: db_config.user, 
  password: db_config.password,
  database: db_config.name,
  port: db_config.port
});

let query = async function (query) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(query)
    return true
  } catch (err) {
    console.log(err)
    return false
  } finally {
    if (conn) conn.release()
  }
}

let queryResult = async function (query) {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query(query)
  } catch (err) {
    console.log(err)
    return null
  } finally {
    if (conn) conn.release()
  }
}

// here we are exposing the ability to creating new connections
export default {
    getConnection: function(){
      return new Promise(function(resolve,reject){
        pool.getConnection().then(function(connection){
          resolve(connection);
        }).catch(function(error){
          reject(error);
        });
      });
    },
    query: query,
    queryResult: queryResult
  }
