const express = require('express')
const app = express()
var oracledb = require('oracledb')
const { connect } = require('./variables/database_variable')
app.get('/', (req, res)=>{
    res.send("HELLO")
})

const RunApp = async ()=>{
    app.use(express.json)

    app.listen(5000, ()=>{
        console.log('Listening on port 5000')
    })
}

//test db
async function run() {
  let connection = await oracledb.getConnection(connect);
  let result = await connection.execute("SELECT 'Hello World!' FROM dual");
  console.log(result.rows[0]);
}



RunApp().then(()=>{
    run();
    console.log('server is running')
})