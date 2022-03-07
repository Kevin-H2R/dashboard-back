import express from 'express'
import mysql from './services/mysql.js'
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express()
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(cors())
const port = 3000
app.get('/todo', (req, res) => {
  mysql.query('SELECT * FROM todo', (err, rows, fields) =>{
	  res.json({ tasks: rows})
  })
})

app.post('/todo', (req, res) => {
  const name = req.body.name
  mysql.query(`INSERT INTO todo (title, description, done, update_date)
                 VALUES ("${name}", "", FALSE, NOW())`, (err, result) => {
                   if (err) throw err
                   mysql.query(`SELECT * FROM todo WHERE id = ${result.insertId}`, (err, rows, fields) =>{
                    res.json({ task: rows[0]})
                  })
                 })
})

app.post('/todo/toggle', (req, res) => {
  const done = req.body.done
  const id = req.body.id
  mysql.query(`UPDATE todo SET done = ${done} WHERE id = ${id}`, (err) => {
    if (err) throw err
    res.json(true)
  })
})

app.post('/todo/delete', (req, res) => {
  const id = req.body.id
  mysql.query(`DELETE FROM todo WHERE id = ${id}`, (err) => {
    if (err) throw err
    res.json(true)
  })
})

app.listen(port, () => {
	console.log(`App listening on port ${port}`)
})
