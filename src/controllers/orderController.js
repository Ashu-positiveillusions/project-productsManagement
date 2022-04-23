const userModel = require('../models/userModel')
const validator = require('../validator/validator')
const orderModel = require('../models/orderModel')


const createOrders = async function(req,res){
try{

    //path params,valid objectId & authorisation check
    const userId1 = req.params.userId;

    //validating userId from path params
    if(!(validator.isValidObjectId(userId1))) return res.status(400).send({status: false, message: "Please Provide valid userId"})  

    //checking for authorization
    if(userId1 != req.loggedUser) return res.status(401).send({status: false, message: "User is not Authorized"}) 


    const orderDetails = req.body;

    if(Object.keys(orderDetails).length == 0)return res.status(400).send({status: false, message: "Please provide order details to place an order"}) 

    const {userId, items, totalPrice, totalItems, totalQuantity } = orderDetails    

    //must required details of orders

    if(!userId) return res.status(400).send({status:false, message:"Please provide userId"})

    if((items.length == 0) || (typeof(items) == 'string')) return res.status(400).send({status:false, message:"Please provide items"})

    if(!totalPrice) return res.status(400).send({status:false, message:"Please provide totalPrice"})

    if(!totalItems) return res.status(400).send({status:false, message:"Please provide totalItems"})

    if(!totalQuantity) return res.status(400).send({status:false, message:"Please provide totalQuantity"})

    //validating userId from req.body
    if(!(validator.isValidObjectId(userId))) return res.status(400).send({status: false, message: "Please Provide valid userId"})  

    //matched userId from path params and from req.body
    if(userId != userId1) return res.status(400).send({status:false, message:"Please make sure that you can place order for the logged in userId only"})

    //checked if user exists or not
    const user = await userModel.findById(userId)

    if(!user) return res.status(404).send({status:false, message:"User doesn't exists"})


    //creating order
    const orderData = await orderModel.create(orderDetails);
    return res.status(201).send({status:true, message:"Success", data:orderData})


}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}




const updateOrders = async function(req,res){
try{

    //path params,valid objectId & authorisation check
    const userId = req.params.userId;

    //validating userId from path params
    if(!(validator.isValidObjectId(userId))) return res.status(400).send({status: false, message: "Please Provide valid userId"})  

    //checking for authorization
    if(userId != req.loggedUser) return res.status(401).send({status: false, message: "User is not Authorized"}) 

    //checked if user exists or not
    const user = await userModel.findById(userId)

    if(!user) return res.status(404).send({status:false, message:"User doesn't exists"})


    const orderDetails = req.body;

    if(Object.keys(orderDetails).length == 0) return res.status(400).send({status: false, message: "Please provide order details to update an order"}) 


    const {orderId,status} = orderDetails;

    if(!orderId) return res.status(400).send({status:false, message:"Please provide orderid"})
    
    if(!status) return res.status(400).send({status:false, message:"Please provide order status to update"})

    if(!((status == 'completed') || (status == 'cancelled'))) return res.status(400).send({status:false, message:"Order Status value should be either completed or cancelled "})

    
    const orderCheck = await orderModel.findById(orderId)

    if(!orderCheck)  return res.status(404).send({status:false, message:"Order doesn't exists"})

    if(orderCheck.userId != userId) return res.status(400).send({status:false, message:"Requested order doesn't belong to the logged in User"}) 

    if(orderCheck.cancellable == false) return res.status(400).send({status:false, message:"Order cannot be cancelled"}) 

    if(orderCheck.status == "cancelled") return res.status(400).send({status:false, message:"Order already cancelled place a new order"}) 

    if(orderCheck.status == "completed") return res.status(400).send({status:false, message:"Order already completed cannot be cancelled"}) 
    
    //updating order status
    const updateOrderStatus = await orderModel.findOneAndUpdate( {_id:orderId, cancellable:true}, {status:status}, {new:true})

    return res.status(200).send({status:true, message:"Success", data:updateOrderStatus})
}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}

module.exports = {createOrders, updateOrders}