import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import todo from './routes/todo.js'
import crossfit from './routes/crossfit.js'
import attendance from './routes/attendance.js'

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(cors())
const port = 3000

todo(app)
crossfit(app)
attendance(app)

app.listen(port, '0.0.0.0', () => {
  console.log(`App listening on port ${port}`)
})
