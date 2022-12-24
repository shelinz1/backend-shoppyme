const express = require("express");
const crypto = require("crypto");
const User = require("../models/usermodel");
const nodemailer = require("nodemailer");

const forgotpasswordRouter = express.Router();

forgotpasswordRouter.post("/forgotpassword", (req, res) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        res.status(401).send({ message: "Email is not registered." });
      }

      const token = crypto.randomBytes(20).toString("hex");
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000;

      user
        .save()
        .then((user) => {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: `${process.env.EMAIL_ADDRESS}`,
              pass: `${process.env.APP_PASSWORD}`,
            },
          });

          const mailOptions = {
            from: `Shoppyme 🛒 <${process.env.EMAIL_ADDRESS}>`,
            to: `${user.email}`,
            subject:
              "Password reset 🗝.\n\n" +
              "Click the link or copy and paste it in your browser to Reset your password.",
            text:
              "You have to complete this process within one hour of receiving it 💪:\n\n" +
              `http://localhost:3000/reset-password/${token}\n\n` +
              "If you didn't request this, Please ignore this email and your password will remain unchanged 🤷‍♀️.",
          };

          transporter.sendMail(mailOptions, (err, response) => {
            if (err) {
              console.log(err);
              res.status(503).send({ message: "Error sending reset link." });
            } else {
              res.status(200).send("Recovery link sent to your email.");
            }
          });
        })
        .catch((err) => res.status(500).send({ message: err.message }));
    })
    .catch((err) => res.status(500).send({ message: err.message }));
});

module.exports = forgotpasswordRouter;
