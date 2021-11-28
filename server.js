const express = require("express")
const app = express()
const cors = require("cors")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
require("dotenv").config()

// eslint-disable-next-line no-undef
mongoose.connect(process.env.MONGO_URI)

app.use(cors())
app.use(express.static("public"))

const { Schema } = mongoose
const userSchema = new Schema({ username: { type: String, required: true } })

const User = mongoose.model("User", userSchema)

const exerciseSchema = new Schema({
  id: { type: mongoose.Types.ObjectId, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date
})

const Exercise = mongoose.model("Exercise", exerciseSchema)

const parser = bodyParser.urlencoded({ extended: false })

app.get("/", (req, res) => {
  // eslint-disable-next-line no-undef
  res.sendFile(__dirname + "/views/index.html")
})

// eslint-disable-next-line no-undef
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port)
})

app.post("/api/users", parser, (req, res) => {
  const user = User({ username: req.body.username })

  user.save((err, data) => {
    if (err) return console.error(err)

    res.json({ username: data.username, _id: data._id })
  })
})

app.get("/api/users", async (req, res) => {
  const allUsers = await User.find({})

  const jsonArray = []
  allUsers.forEach((currentValue) => {
    jsonArray.push(currentValue)
  })

  res.contentType("application/json")
  res.send(JSON.stringify(jsonArray))
})

app.post("/api/users/:_id/exercises", parser, async (req, res) => {
  const id = req.params._id

  User.findOne({ _id: id }, (err, user) => {
    if (err) return console.error(err)

    if (user == null) {
      res.send("Unknown userId")

    } else {
      const dateInt = Date.parse(req.body.date)
      const date = getDate(dateInt)

      const exercise = Exercise({
        id: id, description: req.body.description,
        duration: req.body.duration, date: date
      })

      exercise.save((err, data) => {
        if (err) return console.log(err)

        exercise.date = date.toDateString()
        res.json({
          _id: data.id, username: user.username, date: data.date.toDateString(),
          duration: data.duration, description: data.description
        })
      })
    }
  })
})

app.get("/api/users/:id/logs", async (req, res) => {
  User.findOne({ _id: req.params.id }, (err, user) => {
    if (err) return console.error(err)

    if (user == null) {
      res.send("Unknown userId")

    } else {
      const jsonObject = { _id: user._id, username: user.username }
      const query = Exercise.find({ id: req.params.id })

      if (req.query.from) {
        query.where("date").gte(req.query.from)
      }

      if (req.query.to) {
        query.where("date").lt(req.query.to)
      }


      query.sort({ date: "desc" })
      query.limit(req.query.limit)


      query.exec((err, data) => {
        if (err) return console.error(err)

        const jsonArray = []

        data.forEach((element) => {
          jsonArray.push({
            description: element.description,
            duration: element.duration, date: element.date.toDateString()
          })
        })

        jsonObject.count = data.length
        jsonObject.log = jsonArray

        res.json(jsonObject)
      })
    }
  })
})

function getDate(dateInt) {
  let date

  if (isNaN(dateInt)) {
    date = new Date()
  } else {
    date = new Date(dateInt)
  }

  return date
}