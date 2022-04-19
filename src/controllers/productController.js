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
    if(!installments) return res.status(400).send({status: false, message:"installments Required"})

    price = JSON.parse(price)
    installments = JSON.parse(installments)

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
    const keys = Object.keys(filter);
    filter.isDeleted = false

    if(keys.includes("priceSort")){
        if(!((filter.priceSort == 1) || (filter.priceSort == -1))) return res.status(400).send({status: false, message: "priceSort value should be either 1 or -1"})
    }

    // filter includes name
    if(keys.includes("name")){
        let name1 = filter.name;
        delete filter.name;
        filter.title = {$regex: name1}//$regex: provides regular expression capabilities for pattern matching strings in queries.
        console.log(filter);

        if(keys.includes("priceSort")){
            const sort = filter.priceSort;
            delete filter.priceSort;
            const products = await productModel.find(filter).sort({price: sort});
            if(products.length == 0) return res.status(404).send({status: false, message: "No products available."})
            return res.status(200).send({status: true, message: "success", data: products})
        }
        const products = await productModel.find(filter);
        if(products.length == 0) return res.status(404).send({status: false, message: "No products available."})
        return res.status(200).send({status: true, message: "success", data: products})
    }

    // filter includes size
    if(keys.includes("size")){
        let size = filter.size.split(",");
        delete filter.size
        filter.availableSizes = {$in: size}
        console.log(filter);
        if(keys.includes("priceSort")){
            const sort = filter.priceSort;
            delete filter.priceSort;
            const products = await productModel.find(filter).sort({price: sort});
            if(products.length == 0) return res.status(404).send({status: false, message: "No products available for requested sizes."})
            return res.status(200).send({status: true, message: "success", data: products})
        }
        const products = await productModel.find(filter);
        if(products.length == 0) return res.status(404).send({status: false, message: "No products available for requested sizes."})
        return res.status(200).send({status: true, message: "success", data: products})
    }

    // filter includes price - gt and lt
    if((keys.includes("priceGreaterThan")) && (keys.includes("priceLessThan"))){
        let gt = Number(filter.priceGreaterThan);
        let lt = Number(filter.priceLessThan);
        if(keys.includes("priceSort")){
            const sort = filter.priceSort;
            delete filter.priceSort;
            const products = await productModel.find({price: {$gt: gt, $lt: lt}, isDeleted:false}).sort({price: sort});
            if(products.length == 0) return res.status(404).send({status: false, message: "No products available for requested prices."})
            return res.status(200).send({status: true, message: "success", data: products})
        }
        const products = await productModel.find({price: {$gt: gt, $lt: lt}, isDeleted:false});
        if(products.length == 0) return res.status(404).send({status: false, message: "No products available for requested prices."})
        return res.status(200).send({status: true, message: "success", data: products})
    }

    if(keys.includes("priceGreaterThan")){
        let gt = Number(filter.priceGreaterThan);
        if(keys.includes("priceSort")){
            const sort = filter.priceSort;
            delete filter.priceSort;
            const products = await productModel.find({price: {$gt: gt}, isDeleted:false}).sort({price: sort});
            if(products.length == 0) return res.status(404).send({status: false, message: "No products available for requested prices."})
            return res.status(200).send({status: true, message: "success", data: products})
        }
        const products = await productModel.find({price: {$gt: gt}, isDeleted:false});
        if(products.length == 0) return res.status(404).send({status: false, message: "No products available for requested prices."})
        return res.status(200).send({status: true, message: "success", data: products})
    }

    if(keys.includes("priceLessThan")){
        let lt = Number(filter.priceLessThan);
        if(keys.includes("priceSort")){
            const sort = filter.priceSort;
            delete filter.priceSort;
            const products = await productModel.find({price: {$lt: lt}, isDeleted:false}).sort({price: sort});
            if(products.length == 0) return res.status(404).send({status: false, message: "No products available for requested prices."})
            return res.status(200).send({status: true, message: "success", data: products})
        }
        const products = await productModel.find({price: {$lt: lt}, isDeleted:false});
        if(products.length == 0) return res.status(404).send({status: false, message: "No products available for requested prices."})
        return res.status(200).send({status: true, message: "success", data: products})
    }

    // filter includes size and name
    // filter includes name and price - gt and lt
    // filter includes size and price - gt and lt
    // filter includes name and price and size
    
    if(keys.includes("priceSort")){
        const sort = filter.priceSort;
        delete filter.priceSort;
        const products = await productModel.find(filter).sort({price: sort});
        if(products.length == 0) return res.status(404).send({status: false, message: "No products available."})
        return res.status(200).send({status: true, message: "success", data: products})
    }
    const products = await productModel.find(filter);
    return res.status(200).send({status:true, message: "Success", data: products})

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
    
    const keys = Object.keys(updateData)


    //title duplicity
    if(keys.includes("title")){
        if(!updateData.title) return res.status(400).send({status: false, message: "Please provide a proper title to update."})
        updateData.title = updateData.title.trim();
        if(!updateData.title) return res.status(400).send({status: false, message: "Please provide a proper title to update."})
        const duplicateTitle = await productModel.findOne({title:updateData.title})
        if(duplicateTitle) return res.status(400).send({status:false, message:"Title is duplicate"})
    }

    if(keys.includes("description")){
        if(!updateData.description) return res.status(400).send({status: false, message: "Please provide a proper description to update."})
        updateData.description = updateData.description.trim();
        if(!updateData.description) return res.status(400).send({status: false, message: "Please provide a proper description to update."})
    }
    
    //enum check availableSizes
    if(keys.includes("availableSizes")){
        const sizes =  ["S", "XS","M","X", "L","XXL", "XL"]
        if(!(updateData.availableSizes)) return res.status(400).send({status: false, message: "Please provide atleast one size to update" })
        for(let i=0;i<updateData.availableSizes.length;i++){
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