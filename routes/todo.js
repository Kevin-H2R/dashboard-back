import pool from '../services/mariadb.js'

export default function (app) {
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
}