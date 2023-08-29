require("reflect-metadata");
const express = require("express");
  

const RunApp = async () => {
  //Initialize server
  const app = express();

  app.use(express.json());
  //#region ORM DBA
  const AppDataSource = require("./config/database").AppDataSource;
  await AppDataSource.initialize();
  //#endregion

  //#region Routes
  app.get("/", (req, res) => {
    res.send("HELLO");
  });

  const authRoute = require("./routes/auth/auth");
  app.use(authRoute);
  //#endregion
  app.listen(5000, () => {
    console.log("Listening on port 5000");
  });
}

//test db
// async function run() {
//   let connection = await oracledb.getConnection(connect);
//   let result = await connection.execute("SELECT 'Hello World!' FROM dual");
//   console.log(result.rows[0]);
// }

RunApp().then(() => {
  console.log("server is running");
});
