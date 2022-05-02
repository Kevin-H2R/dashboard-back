import axios from 'axios'
import pool from '../services/mariadb.js'

export default function (app) {
  app.post('/attendance', (req, res) => {
    const time = req.body.time
    const login = req.body.login
    const cookie = req.body.cookie
    axios.post('http://crossfitzone.cafe24.com/class_requestAct2_new.php',
      new URLSearchParams({ time: time, type: 1, weekType: 1 }),
      { withCredentials: true, headers: { common: { 'Cookie': cookie } } })
      .then(async () => {
        const date = new Date()
        date.setHours(time + 12)
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const formatedDate = `${date.getFullYear()}-${month}-${date.getDate()} ${date.getHours()}:00:00`
        await pool.query(`INSERT INTO attendance (session_id, login, time) VALUES
          ((SELECT id FROM crossfit_session WHERE DATE(date) = CURDATE()), "${login}", "${formatedDate}")`)
        res.json(true)
      })
      .catch((err) => {
        console.log(err)
      })
  })

  app.get('/attendance/kebinou', async (req, res) => {
    let result = await pool.queryResult('SELECT DATE_FORMAT(time,\'%Y-%m-%d\') as time FROM attendance WHERE login = "kebinou"')
    result = result.map(elem => elem.time.substring(0, 10))
    res.json(result)
  })

  app.get('/attendance/nara', async (req, res) => {
    let result = await pool.queryResult('SELECT DATE_FORMAT(time,\'%Y-%m-%d\') as time FROM attendance WHERE login = "sinmk333"')
    result = result.map(elem => elem.time.substring(0, 10))
    res.json(result)
  })

  app.post('/attendance/cancel', (req, res) => {
    const cookie = req.body.cookie
    const time = req.body.time
    const login = req.body.login
    axios.post('http://crossfitzone.cafe24.com/ajax/cancelreq2.php',
      new URLSearchParams({ time: time }),
      { withCredentials: true, headers: { common: { 'Cookie': cookie } } })
      .then(async () => {
        await pool.query(`DELETE FROM attendance WHERE login = "${login}" AND DATE(time) = CURDATE()`)
        res.json(true)
      })
  }) 
}