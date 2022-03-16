import express from 'express'
import pool from './services/mariadb.js'
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(cors())
const port = 3000

app.get('/todo', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    let rows = await conn.query('SELECT * FROM todo ORDER BY creation_date DESC')
    rows.map(r => {
      r.done = r.done === 1
      return r
    })
    res.json({ tasks: rows })
  } catch (err) {

  } finally {
    if (conn) conn.release()
  }
})

app.post('/todo', async (req, res) => {
  const name = req.body.name
  let conn;
  try {
    conn = await pool.getConnection();
    let result = await conn.query(`INSERT INTO todo (title, description, done, creation_date, update_date)
           VALUES ("${name}", "", FALSE, NOW(), NOW())`)
    let rows = await conn.query(`SELECT * FROM todo WHERE id = ${result.insertId}`)
    rows[0].done = rows[0].done === 1
    res.json({ task: rows[0] })
  } catch (err) {
    console.log(err)
  } finally {
    if (conn) conn.release()
  }
})

app.post('/todo/toggle', async (req, res) => {
  const done = req.body.done
  const id = req.body.id
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`UPDATE todo SET done = ${done} WHERE id = ${id}`)
    res.json(true)
  } catch (err) {
    console.log(err)
  } finally {
    if (conn) conn.release()
  }
})

app.post('/todo/delete', (req, res) => {
  const id = req.body.id
  mysql.query(`DELETE FROM todo WHERE id = ${id}`, (err) => {
    if (err) throw err
    res.json(true)
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`App listening on port ${port}`)
})
