const express = require("express");
const asyncHandler = require("express-async-handler");
const User = require("../models/usermodel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const resetPasswordRouter = express.Router();

resetPasswordRouter.get(
  "/reset/:token",
  asyncHandler(async (req, res) => {
    const token = req.params.token;

    //check if token is valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (user) {
      res.status(200).send({ message: "Reset link is valid." });
    } else {
      res
        .status(401)
        .send({ message: "Invalid or expired password reset link." });
    }
  })
);

//Update password
resetPasswordRouter.post(
  "/reset/:token",
  asyncHandler(async (req, res) => {
    const { password } = req.body;
    const token = req.params.token;

    // Check if user exists
    const userExists = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (userExists) {
      if (password) {
        userExists.password = await bcrypt.hash(password, 10);
        userExists.resetPasswordToken = null;
        userExists.resetPasswordExpires = null;
      }

      await userExists.save();

      res.status(200).send({ message: "password updated successfully." });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: `${process.env.EMAIL_ADDRESS}`,
          pass: `${process.env.APP_PASSWORD}`,
        },
       
      });

      const mailOptions = {
        from: `Shoppyme 🛒 ${process.env.EMAIL_ADDRESS}`,
        to: `${userExists.email}`,
        subject: "Password reset 🔐.",
        text: `Hi ${userExists.name} \n
           This is a confirmation that the password for your account ${userExists.email} has been changed.\n
           `,
      };

      transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
          res.status(503).send({ message: err.message });
        } else {
          res.status(200).send("Password updated successfully");
        }
      });
    } else {
      res.status(404).send({ message: "Invalid token." });
    }
  })
);

module.exports = resetPasswordRouter;
