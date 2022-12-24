const express = require("express");
const asyncHandler = require("express-async-handler");
const Product = require("../models/productmodel.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

const productRouter = express.Router();

// ADMIN GET ALL PRODUCT
productRouter.get(
  "/all/products",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const searchProduct = req.query.searchProduct
      ? {
          name: {
            $regex: req.query.searchProduct,
            $options: "i",
          },
        }
      : {};

    const products = await Product.find({ ...searchProduct });
    res.status(200).send({ products });
  })
);

// CLIENT GET ALL PRODUCTS
productRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pageSize = 6;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};
    const count = await Product.countDocuments({ ...keyword });
    const pages = Math.ceil(count / pageSize);

    const products = await Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1));
    // .sort({ _id: -1 });
    res.status(200).send({ products, page, pages });
  })
);

//ADMIN ADD PRODUCT
productRouter.post(
  "/add",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, price, countInStock, category, description, image } =
      req.body;

    const productExist = await Product.findOne({ name });

    if (productExist) {
      res.status(400);
      throw new Error("product name already exist");
    }

    const product = new Product({
      name,
      price,
      countInStock,
      category,
      description,
      image,
      user: req.user._id,
    });

    if (product) {
      const createdProduct = await product.save();
      res.status(201).send(createdProduct);
    } else {
      res.status(400);
      throw new Error("Invalid product data");
    }
  })
);

//GET SINGLE PRODUCT
productRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.status(200).send(product);
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  })
);

//GET SINGLE PRODUCT BY ADMIN
productRouter.get(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.status(200).send(product);
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  })
);

//PRODUCT REVIEW
productRouter.post(
  "/:id/review",
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        res.status(400);
        throw new Error("product has already been reviewed.");
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).send({ message: "Review has been added." });
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  })
);

//ADMIN DELETE PRODUCT
productRouter.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (product) {
      await product.remove();
      res.status(200).send({ message: "product has been deleted" });
    } else {
      res.status(404);
      throw new Error("product does not exist");
    }
  })
);

//ADMIN UPDATE PRODUCT
productRouter.put(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, price, countInStock, category, description, image } =
      req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.countInStock = countInStock || product.countInStock;
      product.category = category || product.category;
      product.description = description || product.description;
      product.image = image || product.image;

      const updatedProduct = await product.save();
      res.status(200).send(updatedProduct);
    } else {
      res.status(404);
      throw new Error("product not found.");
    }
  })
);

module.exports = productRouter;
