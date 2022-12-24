const express = require("express");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/usermodel");
const { protect, admin } = require("../middleware/authMiddleware");

const userRouter = express.Router();

//GENEREATE JWT TOKEN
const getToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

//GET ALL USERS - By admin 📃
userRouter.get(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const searchuser = req.query.searchuser
      ? {
          name: {
            $regex: req.query.searchuser,
            $options: "i",
          },
        }
      : {};
    const users = await User.find({ ...searchuser });

    res.status(200).send(users);
  })
);

//REGISTER A USER ®
userRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, isAdmin } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please enter all fields");
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error("You are already a registered user");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isAdmin,
    });

    if (user) {
      res.status(201).send({
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: getToken(user._id),
      });
    } else {
      res.status(400);
      // throw new Error("Invalid user data");
    }
  })
);

//LOGIN A USER 👨‍🎤
userRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("Please enter all fields");
    }
    //check if user is already registered
    const user = await User.findOne({ email });

    //compare entered password with registered pasword and return a json object
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).send({
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: getToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error("Email or Password not registered.");
    }
  })
);

//GET USER PROFILE 
userRouter.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    // const user = await User.findById(req.user._id);
    const user = await User.findById(req.params.id);
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);

//UPDATE USER PROFILE 🆕
userRouter.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const { name, password } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
      user.name = name || user.name;

      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await user.save();
      res.status(200).send({
        _id: updatedUser.id,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin,
        token: getToken(updatedUser),
      });
    } else {
      res.status(404);
      throw new Error("user not found.");
    }
  })
);

module.exports = userRouter;
