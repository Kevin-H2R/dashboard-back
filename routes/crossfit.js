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
                const node = wod[wod.length - 1]
                const titleTag = node.getElementsByTagName('dt')[0]
                const title = titleTag.text
                const descriptionTag = node.getElementsByTagName('dd')[1]
                const description = descriptionTag.innerHTML.trim()
                await pool.query(`INSERT INTO crossfit_session (date, title, description) VALUES (NOW(), "${title}", "${description}")`)
                res.json({ title: title, description: description })
            })
    })

    app.get('/crossfit/login', async (req, res) => {
        axios.post('http://crossfitzone.cafe24.com/ajax/login.php', new URLSearchParams({ lg: 'kebinou', pwd: '2Q34,7*|' }), { withCredentials: true })
            .then(async response => {
                let session = await pool.queryResult("SELECT * FROM crossfit_session WHERE DATE(date) = CURDATE()")
                session = session.shift()
                let registered = false
                let time = null;
                if (session['attended_time'] !== null) {
                    let date = new Date(session['attended_time'])
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
        new URLSearchParams({ time: time}),
            // {time: time},
            { withCredentials: true, headers: { common: { 'Cookie': cookie } } })
            .then(async (result) => {
                console.log(result)
                await pool.query('UPDATE crossfit_session SET attended_time = NULL WHERE DATE(date) = CURDATE()')
                res.json(true)
            })
    })
}