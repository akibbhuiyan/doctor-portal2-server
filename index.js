const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("doctors"));
app.use(fileUpload());
const port = 5000;
app.get("/", (req, res) => {
  res.send("Doctor Portal server");
});

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster1.g0q0cnp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const AppointmentCollection = client
      .db("doctorPortal")
      .collection("appointment");
    const doctorsCollection = client.db("doctorPortal").collection("doctors");

    app.post("/addAppoinment", (req, res) => {
      const appointment = req.body;
      AppointmentCollection.insertOne(appointment).then((result) => {
        res.send(result.acknowledged);
      });
    });
    app.post("/appoinmentsByDate", (req, res) => {
      const date = req.body.date;
      console.log(date);
      const email = req.body.email;
      const filters = { date: date.date };

      doctorsCollection.find({ email: email }).toArray((err, doctors) => {
        if (doctors.length === 0) {
          filters.email = email;
        }
        AppointmentCollection.find(filters).toArray((err, document) => {
          res.send(document);
        });
      });
    });
    app.get("/appointments", (req, res) => {
      AppointmentCollection.find({}).toArray((err, document) => {
        res.send(document);
      });
    });
    app.post("/addDoctor", (req, res) => {
      const file = req.body.image;
      const name = req.body.name;
      const email = req.body.email;
      const number = req.body.number;
      doctorsCollection
        .insertOne({ name: name, email: email, number: number, image: file })
        .then((result) => {
          res.send(result.acknowledged);
        });
    });
    app.get("/doctor", (req, res) => {
      doctorsCollection.find({}).toArray((err, document) => {
        res.send(document);
      });
    });
    app.post("/isDoctor", (req, res) => {
      const email = req.body.email;
      doctorsCollection.find({ email: email }).toArray((err, doctors) => {
        res.send(doctors.length > 0);
      });
    });
  } finally {
  }
}
run().catch(console.log);

app.listen(process.env.PORT || port);
