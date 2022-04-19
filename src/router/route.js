const express = require('express');
const router = express.Router();

const userController = require("../controllers/userController")
const productController = require("../controllers/productController")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")
const auth = require("../middleware/auth")



//user api
router.post('/register', userController.registerUser)
router.post('/login', userController.loginUser)
router.get('/user/:userId/profile', auth.authenticationUser, userController.getUserProfile)
router.put('/user/:userId/profile', auth.authenticationUser, userController.updateUserProfile)


//product api
router.post('/products', productController.createProduct)
router.get('/products', productController.productsData)
router.get('/products/:productId', productController.getProductById)
router.put('/products/:productId', productController.updateProductById)
router.delete('/products/:productId', productController.deleteProduct)


//cart api
router.post('/users/:userId/cart',  auth.authenticationUser, cartController.createCart)
router.put('/users/:userId/cart',  auth.authenticationUser, cartController.removeProduct)
router.get('/users/:userId/cart',  auth.authenticationUser, cartController.getCart)
router.delete('/users/:userId/cart',  auth.authenticationUser, cartController.deleteCart)


//order api
router.post('/users/:userId/orders',  auth.authenticationUser, orderController.createOrders)
router.put('/users/:userId/orders',  auth.authenticationUser, orderController.updateOrders)

module.exports = router;