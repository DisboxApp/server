const express = require('express');
var cors = require('cors')
var bodyParser = require('body-parser')


const disboxFile = require('./disbox-file');

const app = express();
const port = 8080;

app.use(cors())
app.use(bodyParser.json())

app.get('/files/get/:userId', (req, res) => {
  disboxFile.getFileTree(req.params.userId, (err, data) => {
    if (err) {
      res.status(500).send(err);
    }
    res.send(data);
  });
})


app.post('/files/update/:userId/:id', (req, res) => {
  disboxFile.updateFile(req.params.userId, req.params.id, req.body, (err) => {
    if (err) {
      res.status(500).send(err);
    }
    res.send(req.params.id);
  });
});

app.post('/files/create/:userId', (req, res) => {
  disboxFile.createFile(req.params.userId, req.body, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      console.log(data);
      res.send(data.toString());
    }
  });
});

// TODO: Delete directory?
app.delete('/files/delete/:userId/:id', (req, res) => {
  disboxFile.deleteFile(req.params.userId, req.params.id, (err) => {
    if (err) {
      res.status(500).send(err);
    }
    res.send(req.params.id);
  });
});


app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})