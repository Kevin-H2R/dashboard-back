import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import todo from './routes/todo.js'
import crossfit from './routes/crossfit.js'
import attendance from './routes/attendance.js'
import session from 'express-session'

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
console.log(process.env.VUE_APP_HOST)
app.use(cors({
  credentials: true,
  origin: process.env.VUE_APP_HOST
}))
app.set('trust proxy', 1)
app.use(session({
  secret: 'Toto va a la plage',
  name: 'KebinouSessionName',
  resave: false,
  saveUninitialized: true,
  proxy: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    // httpOnly: false,
    sameSite: 'None',
    secure: true
  }
}))

const port = 3000

todo(app)
crossfit(app)
attendance(app)

app.listen(port, '0.0.0.0', () => {
  console.log(`App listening on port ${port}`)
})
