import axios from 'axios'
import pool from '../services/mariadb.js'

export default function (app) {
  app.post('/attendance', (req, res) => {
    const time = req.body.time
    console.log('login from attendance: ' + req.session.login)
    axios.post('http://crossfitzone.cafe24.com/class_requestAct2_new.php',
      new URLSearchParams({ time: time, type: 1, weekType: 1 }),
      { withCredentials: true, headers: { common: { 'Cookie': req.session.PHPSESSID } } })
      .then(async () => {
        await pool.query(`INSERT INTO attendance (session_id, login, time) VALUES
          ((SELECT id FROM crossfit_session WHERE DATE(date) = CURDATE()), "${req.session.login}", CONCAT(CURDATE(), ' ${parseInt(time) + 12}:00:00'))`)
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
    const time = req.body.time
    axios.post('http://crossfitzone.cafe24.com/ajax/cancelreq2.php',
      new URLSearchParams({ time: time }),
      { withCredentials: true, headers: { common: { 'Cookie': req.session.PHPSESSID } } })
      .then(async () => {
        await pool.query(`DELETE FROM attendance WHERE login = "${req.session.login}" AND DATE(time) = CURDATE()`)
        res.json(true)
      })
  }) 
}