const productModel = require('../models/productModel')
const validator = require('../validator/validator');
const aws = require('../photoUpload/awsS3')


const createProduct = async function(req,res){
try{

    if(!req.body.title)return res.status(400).send({status: false, message:"Title Required"})
    if(!req.body.description) return res.status(400).send({status: false, message:"Description Required"})

    req.body.title =  req.body.title.trim()
    req.body.description =  req.body.description.trim()


    const productData = req.body;
    let {title, description, price, availableSizes, installments} =productData;
    
    //required validation
    if(!title) return res.status(400).send({status: false, message:"Title Required"})
    if(!description) return res.status(400).send({status: false, message:"Description Required"})
    if(!price) return res.status(400).send({status: false, message:"Price Required"})
    
    productData.price = JSON.parse(price)
    
    //validation of availableSizes
    const sizes =  ["S", "XS","M","X", "L","XXL", "XL"]
    if(!availableSizes) return res.status(400).send({status: false, message: "Please enter atleast one size."})
    
    for(let i=0;i<availableSizes.length;i++){
        if(!(sizes.includes(availableSizes[i]))){
            return res.status(400).send({status: false, message:"Sizes should be among [S, XS, M, X, L, XXL, XL]"})
        }
    }

    //duplicity check of title
    const duplicateTitle = await productModel.findOne({title:title})
    if(duplicateTitle) return res.status(400).send({status: false, message:"Duplicate title"})

    //uploading files
    let files = req.files
    if (files && files.length > 0){
        let uploadedFileURL = await aws.uploadFile(files[0])
        productData.productImage = uploadedFileURL
    } else {
        res.status(400).send({status:false, message: "Please provide a product image to upload against a key 'files'." })
    }

    const product = await productModel.create(productData)
    return res.status(201).send({status:true, message:"Success", data:product})
}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}


const productsData = async function(req,res){
try{

    const filter = req.query;


    let {name, priceSort, size, priceGreaterThan, priceLessThan} = filter;
    
    // creating an object with isDeleted as false so that no deleted product is returned
    let appliedFilter = {isDeleted: false}
    if(name) appliedFilter.title = {$regex: name}

    if(size) appliedFilter.availableSizes = {$in: size}

    if(priceGreaterThan && priceLessThan) {
        appliedFilter.price = {$gt: priceGreaterThan, $lt: priceLessThan}
    }else if(priceGreaterThan && !priceLessThan){
        appliedFilter.price = {$gt: priceGreaterThan}
    }else if(!priceGreaterThan && priceLessThan){
        appliedFilter.price = {$lt: priceLessThan}
    }

    if(priceSort){
        if(!((priceSort==1) || (priceSort == -1))) return res.status(400).send({status: false, message: "priceSort value should be either 1 or -1"})

        const products = await productModel.find(appliedFilter).sort({price: priceSort});
            if(products.length == 0) return res.status(404).send({status: false, message: "No products available."})
            return res.status(200).send({status: true, message: "success", data: products})
    }

    const products = await productModel.find(appliedFilter);
            if(products.length == 0) return res.status(404).send({status: false, message: "No products available."})
            return res.status(200).send({status: true, message: "success", data: products})


}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}



const getProductById = async function(req, res){
try{

    const productId = req.params.productId;
    if(!(validator.isValidObjectId(productId))) return res.status(400).send({status: false, message: "Please provide valid productId"})

    const productDetails = await productModel.findOne({_id:productId, isDeleted:false})
    if(!productDetails) return res.status(404).send({status:false, message:"No such product exists"})

    return res.status(200).send({status: true, message: 'Success', data:productDetails})

}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}



const updateProductById = async function(req, res){ 
try{

    const productId = req.params.productId;
    if(!(validator.isValidObjectId(productId))) return res.status(400).send({status: false, message: "Please provide valid productId"})


    let files = req.files
    if (files && files.length > 0) {
        let uploadedFileURL = await aws.uploadFile(files[0])
        req.body.productImage = uploadedFileURL;
    }
    
    const updateData = req.body;

    if(Object.keys(updateData).length == 0) return res.status(400).send({status:false, message:"Please provide data to update"})
    
    
    const {title, description, availableSizes} = updateData;


    //title duplicity
    if(title){
        if(!updateData.title) return res.status(400).send({status: false, message: "Please provide a proper title to update."})
        updateData.title = updateData.title.trim();
        if(!updateData.title) return res.status(400).send({status: false, message: "Please provide a proper title to update."})
        const duplicateTitle = await productModel.findOne({title:updateData.title})
        if(duplicateTitle) return res.status(400).send({status:false, message:"Title is duplicate"})
    }

    if(description){
        if(!updateData.description) return res.status(400).send({status: false, message: "Please provide a proper description to update."})
        updateData.description = updateData.description.trim();
        if(!updateData.description) return res.status(400).send({status: false, message: "Please provide a proper description to update."})
    }
    
    //enum check availableSizes
    if(availableSizes){
        const sizes =  ["S", "XS","M","X", "L","XXL", "XL"]
        
        for(let i=0;i<=updateData.availableSizes.length;i++){
            if(!(sizes.includes(updateData.availableSizes[i]))){
                return res.status(400).send({status: false, message:"Sizes should be among [S, XS, M, X, L, XXL, XL]"})
            }
        }
        
    }

    const updateDetails = await productModel.findOneAndUpdate({_id:productId, isDeleted:false}, updateData, {new:true})
    if(!updateDetails) return res.status(404).send({status:false, message:"No such product exists"})
    return res.status(200).send({status: true, message: 'Success', data:updateDetails})
}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}




const deleteProduct = async function(req, res){
try{

    const productId = req.params.productId;
    if(!(validator.isValidObjectId(productId))) return res.status(400).send({status: false, message: "Please provide valid productId"})

    const productDetails = await productModel.findOneAndUpdate({_id:productId, isDeleted:false},{isDeleted:true, deletedAt: Date.now()},{new:true})
    if(!productDetails) return res.status(404).send({status:false, message:"No such product exists"})
    return res.status(200).send({status: true, message: 'Deleted Successfully'})
}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}

module.exports = {createProduct, productsData, getProductById, updateProductById, deleteProduct}