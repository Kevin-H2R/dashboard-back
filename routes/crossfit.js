import axios from 'axios'
import { parse } from 'node-html-parser';
import pool from '../services/mariadb.js'

export default function (app) {
  app.get('/crossfit', async (req, res) => {
    const existingSession = await pool.queryResult('SELECT * FROM crossfit_session WHERE DATE(date) = CURDATE()')
    if (existingSession.length > 0) {
      res.json({ title: existingSession[0].title, description: existingSession[0].description })
      return
    }
    axios.get("http://crossfitzone.cafe24.com/wod.php")
      .then(async response => {
        const root = parse(response.data)
        const wod = root.querySelectorAll('.today_wod')
        if (wod.length === 0) {
          res.json({ title: "", description: "" })
          return
        }
        let i = 0
        for (i; i < wod.length; ++i) {
          const cur = wod[i]
          const title = cur.querySelectorAll('.title')[0]
          const wodDate = title.text.trim().substring(0, 10)
          if (new Date(wodDate).getDate() === new Date().getDate()) {
            break
          }
        }
        const node = wod[i]
        if (node === undefined) {
          res.json({title: 'No WOD today', description: 'No WOD today'})
          exit
        }
        const titleTag = node.getElementsByTagName('dt')[0]
        const title = titleTag.text
        const descriptionTag = node.getElementsByTagName('dd')[1]
        const description = descriptionTag.innerHTML.trim()
        await pool.query(`INSERT INTO crossfit_session (date, title, description) VALUES (NOW(), "${title}", "${description}")`)
        res.json({ title: title, description: description })
      })
  })

  app.post('/crossfit/login', async (req, res) => {
    const login = req.body.login
    const password = req.body.password
    axios.post('http://crossfitzone.cafe24.com/ajax/login.php', new URLSearchParams({ lg: login, pwd: password }), { withCredentials: true })
      .then(async response => {
        let attendance = await pool.queryResult(`SELECT * FROM attendance WHERE DATE(time) = CURDATE() AND login = "${login}"`)
        let registered = false
        let time = null;
        if (attendance.length > 0) {
          attendance = attendance.shift()
          let date = new Date(attendance['time'])
          time = date.getHours() - 12
          registered = true
        }
        res.json({ cookie: response.headers['set-cookie'][0], registered: registered, time: time })
      })
  })

  app.post('/crossfit/register', (req, res) => {
    const cookie = req.body.cookie
    const time = req.body.time
    axios.post('http://crossfitzone.cafe24.com/class_requestAct2_new.php',
      new URLSearchParams({ time: time, type: 1, weekType: 1 }),
      { withCredentials: true, headers: { common: { 'Cookie': cookie } } })
      .then(async () => {
        const date = new Date()
        date.setHours(time + 12)
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const formatedDate = `${date.getFullYear()}-${month}-${date.getDate()} ${date.getHours()}:00:00`
        await pool.query(`UPDATE crossfit_session SET attended_time = "${formatedDate}" WHERE DATE(date) = CURDATE()`)
        res.json(true)
      })
  })

  app.post('/crossfit/cancel', (req, res) => {
    const cookie = req.body.cookie
    const time = req.body.time
    axios.post('http://crossfitzone.cafe24.com/ajax/cancelreq2.php',
      new URLSearchParams({ time: time }),
      // {time: time},
      { withCredentials: true, headers: { common: { 'Cookie': cookie } } })
      .then(async (result) => {
        console.log(result)
        await pool.query('UPDATE crossfit_session SET attended_time = NULL WHERE DATE(date) = CURDATE()')
        res.json(true)
      })
  })

  app.get('/crossfit/attendance', async (req, res) => {
    const items = await pool.queryResult('SELECT DATE_FORMAT(attended_time,\'%Y-%m-%d\') as attended_time FROM crossfit_session WHERE attended_time IS NOT NULL')
    const result = items.map(elem => elem.attended_time.substring(0, 10))
    res.json(result)
  })

  app.get('/crossfit/result', async (req, res) => {
    const results = await pool.queryResult(`SELECT cr.id, cr.performance, cs.date, cs.title FROM
     crossfit_result as cr INNER JOIN crossfit_session cs on cr.session_id = cs.id ORDER by cs.date DESC`)
    res.json(results)
  })

  app.get('/crossfit/session', async (req, res) => {
    const sessions = await pool.queryResult('SELECT * FROM crossfit_session order by date DESC')
    res.json(sessions)
  })

  app.post('/crossfit/session', async (req, res) => {
    const sessionId = req.body.sessionId
    let performance = req.body.performance
    performance = performance.replace(/(?:\r\n|\r|\n)/g, '<br>');
    const existingResult = await pool.queryResult(`SELECT id FROM crossfit_result WHERE session_id = ${sessionId}`)
    if (existingResult.length > 0) {
      await pool.query(`UPDATE crossfit_result SET performance = "${performance}" WHERE session_id = ${sessionId}`)
      res.json(true)
      return
    }
    const result = await pool.queryResult(`INSERT INTO crossfit_result (session_id, performance) VALUES (${sessionId}, "${performance}")`)
    const inserted = await pool.queryResult(`SELECT cr.id, cr.performance, cs.date, cs.title FROM
    crossfit_result as cr INNER JOIN crossfit_session cs on cr.session_id = cs.id WHERE cr.id = ${result.insertId} ORDER by cs.date DESC`)
    res.json(inserted[0])
  })
}