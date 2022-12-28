const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
require('dotenv').config()

const MONGO_URI = process.env['MONGO_URI']

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})
const User = mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  duration: Number,
  date: Date
})
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())
app.use("/", bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  const body = req.body
  User.create({username: body.username}, (err, data) => {
    if (err) return console.error(err);
    else {
      console.log({ username: data.username, _id: data._id });
      res.json({ username: data.username, _id: data._id })
    }
  })
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, data) => {
    if (err) return console.error(err);
    else {
      
      let users = data.map(user => ({"username": user.username, "_id":user._id}))
      console.log(users);
      res.json(users)
    }
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const _id = req.params._id
  const body = req.body
  const date = req.body.date ? req.body.date : Date.now()

  User.findById(_id, function(err,user){
    if(err) return console.log(err)
    else{
      Exercise.create({user_id: user._id, description: body.description, duration: body.duration, date: date}, (err, data) => {
        if (err) return console.error(err);
        else {
          console.log({ _id: user._id, username: user.username, date: data.date.toDateString(), duration: data.duration, description: data.description});
      res.json({ _id: user._id, username: user.username, date: data.date.toDateString(), duration: data.duration, description: data.description})
        }
      })
    }
  })
});

app.get('/api/users/:_id/logs?', (req, res) => {
  const _id = req.params._id
  let from = req.query.from ? req.query.from : "0001-01-01"
  let to = req.query.to ? req.query.to : "9999-01-01"
  let limit = req.query.limit
  
  User.findById(_id, (err, user) => {
   if (err) return console.error(err);
    else{
      Exercise.find({user_id: user._id}, (err, exercises) => {
        if (err) return console.error(err);
        else{
            console.log({
            username: user.username,
            count: exercises.length,
            _id: user._id,
            log: exercises.map(ex => ({description: ex.description, duration: ex.duration, date: ex.date.toDateString()}))
          })
           res.json({
            username: user.username,
            count: exercises.length,
            _id: user._id,
            log: exercises.map(ex => ({description: ex.description, duration: ex.duration, date: ex.date.toDateString()}))
          })
        }
      }).where('date').gte(from).lte(to).limit(+limit)
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
