const express = require("express");
const app = express();
app.get("/", (req, res) => {  
    res.send(" ");
});
app.listen(7777, () => {  
    console.log("rodando na porta 7777");
});