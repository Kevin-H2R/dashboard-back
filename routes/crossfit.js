import axios from 'axios'
import { parse } from 'node-html-parser';

export default function(app){
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
      
      app.get('/crossfit/login', (req, res) => {
        axios.post('http://crossfitzone.cafe24.com/ajax/login.php', new URLSearchParams({lg: 'kebinou', pwd: '2Q34,7*|'}), {withCredentials: true})
          .then(response => {
            res.json(response.headers['set-cookie'][0])
          })
      })
      
      app.post('/crossfit/register', (req, res) => {
        const cookie = req.body.cookie
        const time = req.body.time
        axios.post('http://crossfitzone.cafe24.com/class_requestAct2_new.php',
                    new URLSearchParams({time: time, type: 1, weekType: 1}),
                    {withCredentials: true, headers: {common: {'Cookie': cookie}}})
        .then(response => {
          console.log(response)
          res.json(true)
        })
      })
}