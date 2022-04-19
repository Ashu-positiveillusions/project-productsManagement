const { findOneAndUpdate } = require('../models/cartModel')
const cartModel = require('../models/cartModel')
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const validator = require('../validator/validator')

const createCart = async function(req, res){
    
    //path params,valid objectId & authorisation check
    const userId = req.params.userId;

    //validating userId from path params
    if(!(validator.isValidObjectId(userId))) return res.status(400).send({status: false, message: "Please Provide valid userId"})  

    if(userId != req.headers["userid"]) return res.status(401).send({status: false, message: "User is not Authorized"}) 

    //data from body
    const cartData = req.body;

    const userId1 = cartData.userId;

    const productId = cartData.productId

    const cartId = cartData.cartId

    //userId must required
    if(!userId1) return res.status(400).send({status:false, message:"Please provide userId"})

    //validating userId from req.body
    if(!(validator.isValidObjectId(userId1))) return res.status(400).send({status: false, message: "Please Provide valid userId"})  

    //matched userId from path params and from req.body
    if(userId != userId1) return res.status(400).send({status:false, message:"Please make sure that you can add products in cart for the logged in userId only"})

    //checked if user exists or not
    const user = await userModel.findById(userId1)

    if(!user) return res.status(404).send({status:false, message:"User doesn't exists"})

    
    //checking if user has cart already or not
    const cartIdCheck = await cartModel.findOne({userId:userId1})

    //checking if user is passing cartId and a valid one which exists in db
    if(cartData.cartId){
        
        //validating cartId from req.body
        if(!(validator.isValidObjectId(cartId))) return res.status(400).send({status: false, message: "Please Provide valid cartId"})  

        const cart = await cartModel.findById(cartId)
        if(!cart) return res.status(404).send({status:false, message:"cartId doesn't exists or not a valid one"})
    }

    //creating new cart when user has no cart of his id
    if(!cartIdCheck) {  

        const keys = Object.keys(cartData)  

        //creating new cart when user has no cart of his id and also simultaneously passing productId/product to add in cart
        if(keys.includes("productId")){

            //validating productId from req.body
            if(!(validator.isValidObjectId(productId))) return res.status(400).send({status: false, message: "Please Provide valid productId"})  
            
            //checked if product exists or not
            const product = await productModel.findOne({_id:productId, isDeleted:false, installments:{$gt:0}})
            if(!product) return res.status(404).send({status:false, message:"Product doesn't exists or out of stock"}) 
            
            const productObject ={}   
            productObject.productId = productId;
            productObject.quantity = 1;              

            let price = product.price
            let totalPrice = price 
            let totalItems = 1
            
            //decreasing the installments(stock) value of products in product model
            const productInstallments = await productModel.findOneAndUpdate({_id:productId},{$inc:{installments:-1}},{new:true})
            
            //creating cart
            const cart = await cartModel.create({userId:userId1, items:productObject, totalPrice:totalPrice,totalItems:totalItems })
            return res.status(201).send({status:true, message:"Success", data:cart})
        }

        //creating new cart when user has no cart of his id and just passing only userId
        const cart = await cartModel.create({userId:userId1, items:[]})
        return res.status(201).send({status:true, message:"Success", data:cart})

    }else{  //creating cart when user has cart of his id 
        
            //productId must required
            if(!productId) return res.status(400).send({status:false, message:"Please provide productId"})

            //checked if product exists or not
            const product = await productModel.findOne({_id:productId, isDeleted:false, installments:{$gt:0}})
            if(!product) return res.status(404).send({status:false, message:"Product doesn't exists or out of stock"})          
        
            let items = cartIdCheck.items            
            let products = items.map(a => a.productId.toString())
            
            if(products.includes(productId)){//checking if passed productId/product already present in cart

                let index = products.indexOf(productId)
                items[index].quantity = items[index].quantity +1
                
            }else{ //if passed productId/product not present in cart   
                        
                items.push({productId:productId,quantity:1})    
            }
            let price = product.price
            let totalPrice = cartIdCheck.totalPrice + price
            let totalItems = cartIdCheck.totalItems + 1

            //decreasing the installments(stock) value of products in product model
            const productInstallments = await productModel.findOneAndUpdate({_id:productId},{$inc:{installments:-1}},{new:true})

            //creating cart
            const cart = await cartModel.findOneAndUpdate({userId:userId1},{items:items, totalPrice: totalPrice,totalItems:totalItems }, {new:true})
            return res.status(201).send({status:true, message:"Success", data:cart})
    }
}




const removeProduct = async function(req, res){

    //path params,valid objectId & authorisation check
    const userId = req.params.userId;

    //validating userId from path params
    if(!(validator.isValidObjectId(userId))) return res.status(400).send({status: false, message: "Please Provide valid userId"})  

    if(userId != req.headers["userid"]) return res.status(401).send({status: false, message: "User is not Authorized"}) 

    
    //checked if user exists or not
    const user = await userModel.findById(userId)

    if(!user) return res.status(404).send({status:false, message:"User doesn't exists"})


    //data from body
    const cartData = req.body;

    const cartId = cartData.cartId

    const productId = cartData.productId

    const removeProduct = cartData.removeProduct

    
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
    if(removeProduct != 0 && removeProduct !=1) return res.status(400).send({status: false, message: "removeProduct value should be 0 or 1"})  


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

        let totalPrice = cart.totalPrice -(quantity * price)

        let totalItems = cart.totalItems -quantity

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

    
}


const getCart = async function(req,res){

    const userId = req.params.userId

    if(!(validator.isValidObjectId(userId))) return res.status(400).send({status: false, message: "Please enter a valid UserId in params."})

    if(userId != req.headers["userid"]) return res.status(401).send({status: false, message: "User is not Authorized"})
    
    const user = await userModel.findOne({_id: userId})
    if(!user) return res.status(404).send({status: false, message: "User not found in database."})


    const cart = await cartModel.findOne({userId: userId}).lean().populate('items.productId');

    if(!cart) return res.status(404).send({status: false, message: "Cart not found in database."})

    return res.status(200).send({status: true, message: "success", data: cart})

}



const deleteCart = async function(req,res){

    const userId = req.params.userId
    if(!(validator.isValidObjectId(userId))) return res.status(400).send({status: false, message: "Please enter a valid UserId in params."})

    if(userId != req.headers["userid"]) return res.status(401).send({status: false, message: "User is not Authorized"})
    
    const user = await userModel.findOne({_id: userId})

    if(!user) return res.status(404).send({status: false, message: "User not found in database."})


    const cart = await cartModel.findOneAndUpdate({userId: userId},{items:[], totalPrice:0, totalItems:0})

    if(!cart) return res.status(404).send({status: false, message: "Cart not found in database"})
    
    if(cart.items.length == 0) return res.status(404).send({status: false, message: "Cart not found in database or might be already deleted."})


    const items = cart.items
    for(let i=0; i<items.length; i++){
        let productId = items[i].productId;
        let quantity = items[i].quantity;
        await productModel.findOneAndUpdate({_id: productId},{$inc:{installments: quantity}})
    }

    return res.status(204).send({status: true, message: "successfully deleted"})

}

module.exports = {createCart, removeProduct, getCart, deleteCart}