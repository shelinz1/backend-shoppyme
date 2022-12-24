const express = require("express");
const asyncHandler = require("express-async-handler");
const { protect, admin } = require("../middleware/authMiddleware");
const Order = require("../models/ordermodel");
const nodemailer = require("nodemailer");
const User = require("../models/usermodel");
const orderRouter = express.Router();

//GETING USER ORDERS 🛒
orderRouter.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.status(200).send(orders);
  })
);

//CREATE AN ORDER 🛍
orderRouter.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const {
      orderProducts,
      shippingAddress,
      paymentMethod,
      productsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    } = req.body;

    if (orderProducts && orderProducts.length === 0) {
      res.status(400).send({ message: "cart is empty" });
    } else {
      const order = await Order.create({
        orderProducts,
        shippingAddress,
        paymentMethod,
        productsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        user: req.user._id,
      });

      res.status(201).send({ order });
    }
  })
);

//GET DETAILS ABOUT THE ORDER 📖
orderRouter.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const id = req.params.id;

    const order = await Order.findById(id).populate("user", "name email");

    if (order) {
      res.status(200).send(order);
    } else {
      res.status(404);
      throw new Error("order not found");
    }
  })
);

//DELETE AN ORDER ❌
orderRouter.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const order = await Order.findById(id);
    if (order) {
      await order.remove();
      res.status(200).send({ message: "order has been deleted" });
    } else {
      res.status(404);
      throw new Error("order does not exist");
    }
  })
);

//PAY FOR THE ORDER 💰
orderRouter.put(
  "/:id/pay",
  protect,
  asyncHandler(async (req, res) => {
    const { id, status, update_time, email_address } = req.body;

    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (order) {
      order.isPaid = true;
      order.timeOfPayment = Date.now();

      //payment details coming from paypal
      order.paymentDetails = {
        id,
        status,
        update_time,
        email_address,
      };

      const updatedOrder = await order.save();
      res.status(200).send({ message: "order is paid", order: updatedOrder });

      //Notify user of payment

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: `${process.env.EMAIL_ADDRESS}`,
          pass: `${process.env.APP_PASSWORD}`,
        },
      });

      const mailOptions = {
        from: `Shoppyme 🛒 ${process.env.EMAIL_ADDRESS}`,
        to: `${order.user.email}`,
        subject: "Payment for order 💰",
        text: `Hi ${order.user.name} \n
           This is to let you know that you have succesfully paid for order ☺.
           `,
      };

      transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
          res.status(503).send({ message: err.message });
        } else {
          res.status(200).send("Payment made successfully ☺");
        }
      });
    } else {
      res.status(400).send({ message: "Order does not exist" });
    }
  })
);

//ADMIN GET ALL ORDERS 🛒
orderRouter.get(
  "/all/orders",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const searchorder = req.query.searchorder
      ? {
          name: {
            $regex: req.query.searchorder,
            $options: "i",
          },
        }
      : {};
    const orders = await Order.find({ ...searchorder }).populate(
      "user",
      "id name email"
    );
    res.status(200).send(orders);
  })
);

//DELIVER THE ORDER 🚚
orderRouter.put(
  "/:id/deliver",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (order) {
      order.isDelivered = true;
      order.timeOfDelivery = Date.now();

      const updatedOrder = await order.save();
      res
        .status(200)
        .send({ message: "order is delivered", order: updatedOrder });

      //send delivery mesage back

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: `${process.env.EMAIL_ADDRESS}`,
          pass: `${process.env.APP_PASSWORD}`,
        },
      });

      const mailOptions = {
        from: `Shoppyme 🛒 ${process.env.EMAIL_ADDRESS}`,
        to: `${order.user.email}`,
        subject: "Delivery from Shoppyme 🚚.",
        text: `Hi ${order.user.name} \n
         This is to let you know that your  order ${order._id} was delivered succesfully ☺.
           `,
      };

      transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
          res.status(503).send({ message: err.message });
        } else {
          res.status(200).send("Order delivered successfully.");
        }
      });
    } else {
      res.status(400).send({ message: "Order does not exist." });
    }
  })
);

module.exports = orderRouter;
