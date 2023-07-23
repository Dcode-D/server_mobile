const express = require('express')
const app = express()

app.get('/', (req, res)=>{
    res.send("HELLO")
})

const RunApp = async ()=>{
    app.use(express.json)

    app.listen(5000, ()=>{
        console.log('Listening on port 5000')
    })
}

RunApp().then(()=>{
    console.log('server is running')
})