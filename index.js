const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("doctors"));
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
const sendBookingEmail = (booking) => {
  const { email, date, service } = booking;

  const auth = {
    auth: {
      api_key: process.env.api,
      domain: process.env.domain,
    },
  };

  const transporter = nodemailer.createTransport(mg(auth));

  // let transporter = nodemailer.createTransport({
  //     host: 'smtp.sendgrid.net',
  //     port: 587,
  //     auth: {
  //         user: "apikey",
  //         pass: process.env.SENDGRID_API_KEY
  //     }
  // });

  transporter.sendMail(
    {
      from: "alexboss00852@gmail.com", // verified sender email
      to: email || "akibbhh@gmail.com", // recipient email
      subject: `Your appointment for ${service} is confirmed`, // Subject line
      text: "Hello world!", // plain text body
      html: `
      <h3>Your appointment is confirmed</h3>
      <div>
          <p>Your appointment for treatment: ${service}</p>
          <p>Please visit us on ${date} at </p>
          <p>Thanks from Doctors Portal.</p>
      </div>

      `, // html body
    },
    (error, info) => {
      if (error) {
        console.log("Email send error", error);
      } else {
        console.log("Email sent: " + info);
      }
    }
  );
};
async function run() {
  try {
    const AppointmentCollection = client
      .db("doctorPortal")
      .collection("appointment");
    const doctorsCollection = client.db("doctorPortal").collection("doctors");

    app.post("/addAppoinment", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const query = {
        date: booking.date,
        email: booking.email,
        service: booking.service,
      };

      const alreadyBooked = await AppointmentCollection.find(query).toArray();

      if (alreadyBooked.length) {
        const message = `You already have a booking on ${booking.date}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await AppointmentCollection.insertOne(booking);
      // send email about appointment confirmation
      sendBookingEmail(booking);
      res.send(result);
    });
    app.post("/appoinmentsByDate", (req, res) => {
      const date = req.body.date;
      const email = req.body.email;
      const filters = { date: date };

      doctorsCollection.find({ email: email }).toArray((err, doctors) => {
        if (doctors.length === 0) {
          filters.email = email;
        }
        console.log(filters);
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
    app.get("/deleteUser", (req, res) => {
      const id = req.query.id;
      const filter = { _id: ObjectId(id) };
      AppointmentCollection.deleteOne(filter).then((result) => {
        res.send(result.acknowledged);
      });
    });
    app.post("/contact", (req, res) => {
      const { email, subject, message } = req.body;
      const auth = {
        auth: {
          api_key: process.env.api,
          domain: process.env.domain,
        },
      };

      const transporter = nodemailer.createTransport(mg(auth));

      // let transporter = nodemailer.createTransport({
      //     host: 'smtp.sendgrid.net',
      //     port: 587,
      //     auth: {
      //         user: "apikey",
      //         pass: process.env.SENDGRID_API_KEY
      //     }
      // });

      transporter.sendMail(
        {
          from: email, // verified sender email
          to: "akibbhh@gmail.com",
          subject: `You have a message from Doctors Portal about ${subject} `, // Subject line
          text: "Hello world!", // plain text body
          html: `
          
          <div>
              <p>Message is ${message}</p>
              <p>from Doctors Portal.</p>
          </div>
    
          `, // html body
        },
        (error, info) => {
          if (error) {
            console.log("Email send error", error);
            res.send(error);
          } else {
            console.log("Email sent: " + info);
            res.send(info);
          }
        }
      );
    });
  } finally {
  }
}
run().catch(console.log);

app.listen(process.env.PORT || port);
