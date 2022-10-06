const express = require('express');
const nunjucks = require('nunjucks');
const config = require('./config/config.json');
const mysql = require('mysql');

const app = express();
const port = 8080;

nunjucks.configure('views', {             //configure 환경설정한다.
    express:app, 
    autoescape:true,                      // 보안관련인데 무조건 true로 한다고
});

app.use(express.json());
app.use(express.static("views"));
app.use(express.static('public'));

const corsOptions = {
    origin: (origin, callback) => {
        console.log('[REQUEST-CORS] Request from origin: ', origin);
        if (!origin || whitelist.indexOf(origin) !== -1) callback(null, true)
        else callback(new Error('Not Allowed by CORS'));
    },
    credentials: true,
}

const connection = mysql.createConnection({
    host : config.db.host,
    user : config.db.username,
    password : config.db.password,
    database : config.db.database,
    port: config.db.port
})



connection.connect(function(err) {
    if (err) {
      console.error('Database connection failed: ' + err.stack);
      return;
    }
  
    console.log('Connected to database.');
  });

app.get('/', (req, res) => {
    res.render('index.html');
});


app.listen(port, () => {
   console.log(`Example App Listening @ http://localhost:${ port }`);
});

// window.onload = function(){
//    // 날짜를 한국 식으로 가져오는 방법 
//    const date = new Date();
//    var Today = date.toLocaleString('ko-kr');
// }

