import db_config from '../config/database.js'
import mariadb from 'mariadb';

// here we create a new connection pool
const pool = mariadb.createPool({
  host: db_config.host, 
  user: db_config.user, 
  password: db_config.password,
  database: db_config.name
});

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
    }
  }
