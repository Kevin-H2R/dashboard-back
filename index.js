import express from 'express'
import pool from './services/mariadb.js'
import cors from 'cors'
import bodyParser from 'body-parser'
import axios from 'axios'
import { parse } from 'node-html-parser';

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(cors())
const port = 3000

app.get('/todo', async (req, res) => {
  let rows = await pool.queryResult('SELECT * FROM todo ORDER BY creation_date DESC')
  rows.map(r => {
    r.done = r.done === 1
    return r
  })
  res.json({ tasks: rows })
})

app.post('/todo', async (req, res) => {
  const name = req.body.name
  let result = await pool.queryResult(`INSERT INTO todo (title, description, done, creation_date, update_date)
  VALUES ("${name}", "", FALSE, NOW(), NOW())`)
  let rows = await pool.queryResult(`SELECT * FROM todo WHERE id = ${result.insertId}`)
  rows[0].done = rows[0].done === 1
  res.json({ task: rows[0] })
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

app.post('/todo/delete', async (req, res) => {
  const id = req.body.id
  await pool.query(`DELETE FROM todo WHERE id = ${id}`)
  res.json(true)
})

app.get('/crossfit', (req, res) => {
  axios.get("http://crossfitzone.cafe24.com/wod.php")
    .then(response => {
      const root = parse(response.data)
      const wod = root.querySelectorAll('.today_wod')
      const node = wod[wod.length - 1]
      const titleTag = node.getElementsByTagName('dt')[0]
      const title = titleTag.text
      const descriptionTag = node.getElementsByTagName('dd')[1]
      const description = descriptionTag.innerHTML.trim()
      res.json({title: title, description: description})
    })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`App listening on port ${port}`)
})
