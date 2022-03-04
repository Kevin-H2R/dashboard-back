import express from 'express'
import mysql from './services/mysql.js'
import cors from 'cors'

const app = express()
app.use(cors())
const port = 3000
app.get('/todo', (req, res) => {
  mysql.query('SELECT * FROM todo', (err, rows, fields) =>{
	  res.json({ tasks: rows})
  })
})

app.listen(port, () => {
	console.log(`App listening on port ${port}`)
})
