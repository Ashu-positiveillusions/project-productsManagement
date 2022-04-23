const { findOneAndUpdate } = require('../models/cartModel')
const cartModel = require('../models/cartModel')
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const validator = require('../validator/validator')

const createCart = async function(req, res){
try{

    // validation and authorization of user
    const userId = req.params.userId;
    if(!(validator.isValidObjectId(userId))) return res.status(400).send({status: false, message: "Please enter a valid UserId in params."})
    if(userId != req.loggedUser) return res.status(401).send({status: false, message: "User is not Authorized"})
    
    // checking if user exists
    const user = await userModel.findOne({_id: userId}).lean()
    if(!user) return res.status(400).send({status: false, message: "User not found in database."})
    
    const details = req.body;

    // checking if a cart already exists otherwise creating an empty cart
    let cart1;
    if(!(details.cartId)){
        cart1 = await cartModel.findOne({userId: userId}).lean();
        if(!cart1){
            cart1 = await cartModel.create({userId:userId, items:[]})
        }
        details.cartId = cart1._id
    }
    const cartId = details.cartId

    // checking the product - if it is there in stock
    const productId = details.productId;
    if(!productId) return res.status(400).send({status: false, message: "Please provide a product Id"})
    let product = await productModel.findOne({_id: productId, isDeleted: false, installments: {$gt:0}}).lean()
    if(!product) return res.status(400).send({status: false, message: "Product not found in database or is out of stock."})

    const items = cart1.items;
    let totalPrice = cart1.totalPrice
    let totalItems = cart1.totalItems;

    // checking if a product exists in cart - in not push its quantity of 1 or else increase the quantity
    let productsArray = items.map(e => e.productId.toString()) // [ID1, ID2]
    if(!(productsArray.includes(productId))){
        items.push({productId:productId, quantity: 1})
    }else{
        let index = productsArray.indexOf(productId);
        items[index].quantity = items[index].quantity + 1;
    }

    totalPrice = totalPrice + product.price;
    totalItems = totalItems + 1;

    const obj = {items: items, totalPrice: totalPrice, totalItems: totalItems};

    // updating the cart and product database
    const updatedCart = await cartModel.findOneAndUpdate({_id: cartId} ,obj ,{new:true})
    const updatedProduct = await productModel.findOneAndUpdate({_id:productId}, {$inc: {installments:-1}}, {new:true})
    return res.status(201).send({status:true, message: "success", data: updatedCart})


}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}




const removeProduct = async function(req, res){
try{

    //path params,valid objectId & authorisation check
    const userId = req.params.userId;

    //validating userId from path params
    if(!(validator.isValidObjectId(userId))) return res.status(400).send({status: false, message: "Please Provide valid userId"})  

    if(userId != req.loggedUser) return res.status(401).send({status: false, message: "User is not Authorized"}) 

    
    //checked if user exists or not
    const user = await userModel.findById(userId)

    if(!user) return res.status(404).send({status:false, message:"User doesn't exists"})


    //data from body
    const cartData = req.body;
    const{cartId, productId, removeProduct} = cartData

    
    //cartId must required
    if(!cartId) return res.status(400).send({status:false, message:"Please provide cartId"})

    //productId must required
    if(!productId) return res.status(400).send({status:false, message:"Please provide productId"})
    


    //validating cartId from req.body
    if(!(validator.isValidObjectId(cartId))) return res.status(400).send({status: false, message: "Please Provide valid cartId"})  
    
    //validating productId from req.body
    if(!(validator.isValidObjectId(productId))) return res.status(400).send({status: false, message: "Please Provide valid productId"})  


    //checking if cart exists or not
    const cart = await cartModel.findById(cartId)

    if(!cart) return res.status(404).send({status: false, message: "Cart doesn't exists"})  

    if(cart.userId != userId)  return res.status(400).send({status: false, message: "cart doesn't belongs to loggedIn user"}) 

    //checking removeProduct value in-between 0 & 1
    if((!removeProduct && removeProduct != 0) || (removeProduct != 0 && removeProduct !=1)) return res.status(400).send({status: false, message: "Please provide removeProduct with value 0 or 1"})  


    //removing product from cart    
    const items = cart.items            
    let products = items.map(a => a.productId.toString())

    if(!(products.includes(productId))) return res.status(400).send({status: false, message: "Product doesn't belong to cart"}) 
    
    if(removeProduct == 0){ 
        
        let index = products.indexOf(productId)
        let quantity = items[index].quantity 

        //decreasing the installments(stock) value of products in product model
        const productInstallments = await productModel.findOneAndUpdate({_id:productId},{$inc:{installments:quantity}},{new:true})

        let price = productInstallments.price

        let totalPrice = cart.totalPrice - (quantity * price)

        let totalItems = cart.totalItems - quantity

        items.splice(index, 1)

        const cartCreate = await cartModel.findOneAndUpdate({_id:cartId}, {items:items, totalPrice: totalPrice,totalItems:totalItems }, {new:true})
        return res.status(201).send({status:true, message:"Success", data:cartCreate})
            
    }

    if(removeProduct == 1){

        let index = products.indexOf(productId)

        items[index].quantity = items[index].quantity -1
        
        //decreasing the installments(stock) value of products in product model
        const productInstallments = await productModel.findOneAndUpdate({_id:productId},{$inc:{installments:+1}},{new:true})

        let price = productInstallments.price
        let totalPrice = cart.totalPrice - price
        let totalItems = cart.totalItems - 1

        if(items[index].quantity == 0){
            
            items.splice(index, 1)
            const cartCreate = await cartModel.findOneAndUpdate({_id:cartId}, {items:items, totalPrice: totalPrice,totalItems:totalItems }, {new:true})
            return res.status(201).send({status:true, message:"Success", data:cartCreate})
        }
        
        //creating cart
        const cartCreate = await cartModel.findOneAndUpdate({_id:cartId}, {items:items, totalPrice: totalPrice,totalItems:totalItems }, {new:true})
        return res.status(201).send({status:true, message:"Success", data:cartCreate})
    }
}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}


const getCart = async function(req,res){
try{
    const userId = req.params.userId

    if(!(validator.isValidObjectId(userId))) return res.status(400).send({status: false, message: "Please enter a valid UserId in params."})

    if(userId != req.loggedUser) return res.status(401).send({status: false, message: "User is not Authorized"})
    
    const user = await userModel.findOne({_id: userId})
    if(!user) return res.status(404).send({status: false, message: "User not found in database."})


    const cart = await cartModel.findOne({userId: userId}).lean().populate('items.productId');
    if(!cart) return res.status(404).send({status: false, message: "Cart not found in database."})
    return res.status(200).send({status: true, message: "success", data: cart})

}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}



const deleteCart = async function(req,res){
try{

    const userId = req.params.userId
    if(!(validator.isValidObjectId(userId))) return res.status(400).send({status: false, message: "Please enter a valid UserId in params."})

    if(userId != req.loggedUser) return res.status(401).send({status: false, message: "User is not Authorized"})
    
    const user = await userModel.findOne({_id: userId})

    if(!user) return res.status(404).send({status: false, message: "User not found in database."})


    const cart = await cartModel.findOneAndUpdate({userId: userId},{items:[], totalPrice:0, totalItems:0})

    if(!cart) return res.status(404).send({status: false, message: "Cart not found in database or might be already deleted."})
    
    

    const items = cart.items
    for(let i=0; i<items.length; i++){
        let productId = items[i].productId;
        let quantity = items[i].quantity;
        await productModel.findOneAndUpdate({_id: productId},{$inc:{installments: quantity}})
    }

    return res.status(204).send({status: true, message: "successfully deleted"})

}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}

module.exports = {createCart, removeProduct, getCart, deleteCart}