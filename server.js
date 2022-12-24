const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

const connectDb = require("./config/database");

const { errorHandler } = require("./middleware/errorMiddleware");
const userRouter = require("./routes/usersRoutes.js");
const productRouter = require("./routes/productRoutes.js");
const orderRouter = require("./routes/orderRoutes.js");
const forgotpasswordRouter = require("./routes/forgotpassword.js");
const resetPasswordRouter = require("./routes/resetPassword.js");

dotenv.config();
const app = express();

connectDb();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//get paypal id from environment variable
app.get("/api/keys/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || "sb");
});

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/password", forgotpasswordRouter, resetPasswordRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(
      path.resolve(__dirname, "../", "frontend", "build", "index.html")
    )
  );
} else {
  app.get("/", (req, res) => {
    res.send(
      `<div style="text-align:center;color:yellow"><h5>server running- please set to production</h5></div>`
    );
  });
}

app.use(errorHandler);
app.listen(process.env.PORT, console.log(`server running on port ${process.env.PORT}`));
