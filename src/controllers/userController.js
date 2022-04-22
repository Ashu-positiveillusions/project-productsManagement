const userModel = require('../models/userModel')
const jwt = require('jsonwebtoken')
const validator = require('../validator/validator');
const { findOneAndUpdate } = require('../models/userModel');
const aws = require('../photoUpload/awsS3')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const registerUser = async function (req, res) {
try{

    const userData = req.body;

    if (Object.keys(userData).length == 0) return res.status(400).send({ status: false, message: "Please provide User details." })

    // if valid values not provide to these fields
    if (!userData.fname) return res.status(400).send({ status: false, message: "Please provide fname." })
    if (!userData.lname) return res.status(400).send({ status: false, message: "Please provide lname." })
    if (!userData.email) return res.status(400).send({ status: false, message: "Please provide email." })
    if (!userData.phone) return res.status(400).send({ status: false, message: "Please provide phone." })
    if (!userData.password) return res.status(400).send({ status: false, message: "Please provide password." })

    userData.fname = userData.fname.trim();
    userData.lname = userData.lname.trim();
    userData.email = userData.email.trim();
    userData.phone = userData.phone.trim();
    userData.password = userData.password.trim();

    const { fname, lname, email, phone, password, address } = userData
    

    //fields which are must required - checking them after trimming the strings - checks if "    " string is passed which is invalid
    if (!fname) return res.status(400).send({ status: false, message: "Please provide fname." })
    if (!lname) return res.status(400).send({ status: false, message: "Please provide lname." })
    if (!email) return res.status(400).send({ status: false, message: "Please provide email." })
    if (!phone) return res.status(400).send({ status: false, message: "Please provide phone." })
    if (!password) return res.status(400).send({ status: false, message: "Please provide password." })

    // phone and email validity check
    if (!(validator.checkValidEmail(email))) return res.status(400).send({ status: false, message: "Please enter a valid email." })
    if (!(validator.checkIndianNumber(phone))) return res.status(400).send({ status: false, message: "Please enter a valid phone." })

    // address validations - should be an object of object 
    if (!address || typeof (address) != "object" || Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "Please provide address in object format with valid details." })
    if ((!(address.shipping)) || typeof ((address.shipping)) != "object" || Object.keys((address.shipping)).length == 0) return res.status(400).send({ status: false, message: "Please provide shipping address in object format." })
    if ((!(address.billing)) || typeof ((address.billing)) != "object" || Object.keys((address.billing)).length == 0) return res.status(400).send({ status: false, message: "Please provide billing address in object format." })


    // shipping address validations
    if (!(address.shipping.city)) return res.status(400).send({ status: false, message: "Please enter a valid shipping city." })
    address.shipping.city = address.shipping.city.trim();
    if (!(address.shipping.city)) return res.status(400).send({ status: false, message: "Please enter a valid shipping city." })

    if (!(address.shipping.street)) return res.status(400).send({ status: false, message: "Please enter a valid shipping street." })
    address.shipping.street = address.shipping.street.trim();
    if (!(address.shipping.street)) return res.status(400).send({ status: false, message: "Please enter a valid shipping street." })


    
    if ((!(address.shipping.pincode))) return res.status(400).send({ status: false, message: "Please enter a valid shipping pincode." })
    address.shipping.pincode = JSON.parse(address.shipping.pincode)
    if (!(validator.checkIndianPincode(address.shipping.pincode))) return res.status(400).send(
            { status: false, message: "Please enter a valid 6 digit shipping pincode." }
    )

    // billing address validations
    if (!(address.billing.city)) return res.status(400).send({ status: false, message: "Please enter a valid billing city." })
    address.billing.city = address.billing.city.trim();
    if (!(address.billing.city)) return res.status(400).send({ status: false, message: "Please enter a valid billing city." })

    if (!(address.billing.street)) return res.status(400).send({ status: false, message: "Please enter a valid billing street." })
    address.billing.street = address.billing.street.trim();
    if (!(address.billing.street)) return res.status(400).send({ status: false, message: "Please enter a valid billing street." })

    
    if ((!(address.billing.pincode))) return res.status(400).send({ status: false, message: "Please enter a valid billing pincode." })
    address.billing.pincode = JSON.parse(address.billing.pincode)
    if (!(validator.checkIndianPincode(address.billing.pincode))) return res.status(400).send(
        { status: false, message: "Please enter a valid 6 digit billing pincode." }
    )

    // email and phone duplicity check
    const duplicate = await userModel.find({ $or: [{ email: userData.email }, { phone: userData.phone }] });
    if (duplicate.length != 0) {
        for (let i = 0; i < duplicate.length; i++) {
            if (duplicate[i].email == userData.email) return res.status(400).send({ status: false, message: "Email Id is already in use" });
            if (duplicate[i].phone == userData.phone) return res.status(400).send({ status: false, message: "Phone number is already in use" });
        }
    }


    // password validity and encrypting password
    if (password.length < 8 || password.length > 15) {
        return res.status(400).send({ status: false, message: "Please provide password length in range 8-15." })
    }

    //encrypting the password storing in db
    const pass = await bcrypt.hash(password, saltRounds)
    userData.password = pass

    //upload to s3 and get the uploaded link
    let files = req.files
    if (files && files.length > 0) {
        let uploadedFileURL = await aws.uploadFile(files[0])
        userData.profileImage = uploadedFileURL;
    } else {
        return res.status(400).send({ status: false, message: "Please provide a profile image to upload against a key 'files'." })
    }

    const user = await userModel.create(userData);
    return res.status(201).send({ status: true, message: "User created Successfully", data: user })
}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}


const loginUser = async function (req, res) {
try{

    if(Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "Please Provide Email-Id and Password" })

    const { email, password } = req.body;

    if (!email) return res.status(400).send({ status: false, message: "Please Provide Email-Id" })
    if (!password) return res.status(400).send({ status: false, message: "Please Provide password" })

    if (!(validator.checkValidEmail(email))) return res.status(400).send({ status: false, message: "Please enter a valid email." })

    const userInfo = await userModel.findOne({ email: email })
    if (!userInfo) return res.status(404).send({ status: false, message: "User not found" })

    const passwordCheck = await bcrypt.compare(password, userInfo.password)
    if (!passwordCheck) return res.status(400).send({ status: false, message: "Password doesn't match" })

    const userId = userInfo._id

    const token = jwt.sign({
        userId: userId,
        iat: Math.floor(Date.now() / 1000) + (60 * 60)
    }, "products-management-project", { expiresIn: "10h" })

    res.setHeader("Authorization", token);

    return res.status(200).send({ status: true, message: "User login successfull", data: { userId: userId, token: token } });
}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}


const getUserProfile = async function (req, res) {
try{
    const userId = req.params.userId;

    //checking valid userId
    if (!(validator.isValidObjectId(userId))) return res.status(400).send({ status: false, message: "Please Provide valid userId" })

    //checking for authorized user
    if (userId != req.loggedUser) return res.status(401).send({ status: false, message: "User is not Authorized" })

    const userDetails = await userModel.findById({ _id: userId })
    if (!userDetails) return res.status(404).send({ status: false, message: "No such User Exists" })

    return res.status(200).send({ status: true, message: "User profile details", data: userDetails })
}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}



const updateUserProfile = async function (req, res) {
try{

    let userId = req.params.userId;

    //checking valid userId
    if (!(validator.isValidObjectId(userId))) return res.status(400).send({ status: false, message: "Please Provide valid userId" })

    //checking for authorized user
    if (userId != req.loggedUser) return res.status(401).send({ status: false, message: "You are not authorised." })


        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await aws.uploadFile(files[0])
            req.body.profileImage = uploadedFileURL;
        }


    const updateData = req.body;
    if (Object.keys(updateData).length == 0) return res.status(400).send({ status: false, message: "Please provide user details to be updated." })

    
        //duplication check for valid Indian phone  
    if (updateData.hasOwnProperty("phone")) {
        if (!(validator.checkIndianNumber(updateData.phone))) {
            return res.status(400).send({ status: false, message: "Please provide valid phone number." })
        }
        let duplicate = await userModel.findOne({ phone: updateData.phone });
        if (duplicate) return res.status(400).send({ status: false, message: "Phone number is already in use" });
    }

    //duplication check for a valid email   
    if (updateData.hasOwnProperty("email")) {
        if (!(validator.checkValidEmail(updateData.email))) {
            return res.status(400).send({ status: false, message: "Please provide valid Email-Id." })
        }
        let duplicate = await userModel.findOne({ email: updateData.email });
        if(duplicate) return res.status(400).send({ status: false, message: "Email Id is already in use" });
    }

    if (updateData.hasOwnProperty("password")) {
        if (updateData.password.length < 8 || updateData.password.length > 15) {
            return res.status(400).send({ status: false, message: "Please provide password length in range 8-15." })
        }
        const pass = await bcrypt.hash(password, saltRounds)
        updateData.password = pass
    }

    const user = await userModel.findOne({ _id: userId })
    if (!user) return res.status(404).send({ status: false, message: "User not found" })

    const prevAddress = user.address;

    //checking if address is in object format
    if (updateData.hasOwnProperty("address")) {
        if (typeof (updateData.address) != "object" || Object.keys(updateData.address).length == 0) return res.status(400).send({ status: false, message: "Please enter address in object format with valid keys." })
        const keys1 = Object.keys(updateData.address)

        //if only billing address is passed for updation and not shipping
        if (keys1.includes("billing") && !(keys1.includes("shipping"))) {
            if (typeof (updateData.address.billing) != "object" || Object.keys(updateData.address.billing).length == 0) return res.status(400).send({ status: false, message: "Please enter billing address in object format with valid keys." })

            if (!(updateData.address.billing.city)) return res.status(400).send({ status: false, message: "Please provide a proper billing city" })
            updateData.address.billing.city = updateData.address.billing.city.trim();
            if (!(updateData.address.billing.city)) return res.status(400).send({ status: false, message: "Please provide a proper billing city" })

            if (!(updateData.address.billing.street)) return res.status(400).send({ status: false, message: "Please provide a proper billing street" })
            updateData.address.billing.street = updateData.address.billing.street.trim();
            if (!(updateData.address.billing.street)) return res.status(400).send({ status: false, message: "Please provide a proper billing street" })


            if (!(updateData.address.billing.pincode)) return res.status(400).send({ status: false, message: "Please provide a proper billing pincode" })
            updateData.address.billing.pincode = JSON.parse(updateData.address.billing.pincode)
            if (!(validator.checkIndianPincode(updateData.address.billing.pincode))) return res.status(400).send({ status: false, message: "Please enter a valid 6 digit billing pincode." })

            updateData.address.shipping = prevAddress.shipping;//created key-'shipping' inside address object of update data and its value is taken from existing shipping address

            const updatedUser = await userModel.findOneAndUpdate({ _id: userId }, updateData, { new: true });
            return res.status(200).send({ status: true, message: "User profile updated.", data: updatedUser })

            //if only shipping address is passed for updation and not billing
        } else if (!(keys1.includes("billing")) && keys1.includes("shipping")) {
            if (typeof (updateData.address.shipping) != "object" || Object.keys(updateData.address.shipping).length == 0) return res.status(400).send({ status: false, message: "Please enter shipping address in object format." })

            if (!(updateData.address.shipping.city)) return res.status(400).send({ status: false, message: "Please provide a proper shipping city" })
            updateData.address.shipping.city = updateData.address.shipping.city.trim();
            if (!(updateData.address.shipping.city)) return res.status(400).send({ status: false, message: "Please provide a proper shipping city" })


            if (!(updateData.address.shipping.street)) return res.status(400).send({ status: false, message: "Please provide a proper shipping street" })
            updateData.address.shipping.street = updateData.address.shipping.street.trim();
            if (!(updateData.address.shipping.street)) return res.status(400).send({ status: false, message: "Please provide a proper shipping street" })


            if (!(updateData.address.shipping.pincode)) return res.status(400).send({ status: false, message: "Please provide a proper shipping pincode" })
            updateData.address.shipping.pincode = JSON.parse(updateData.address.shipping.pincode)
            if (!(validator.checkIndianPincode(updateData.address.shipping.pincode))) return res.status(400).send({ status: false, message: "Please enter a valid 6 digit shipping pincode." })


            updateData.address.billing = prevAddress.billing;//created key-'billing' inside address object of update data and its value is taken from existing billing address

            const updatedUser = await userModel.findOneAndUpdate({ _id: userId }, updateData, { new: true });
            return res.status(200).send({ status: true, message: "User profile updated.", data: updatedUser })

            //if both billing and shipping is passed for updation
        } else if ((keys1.includes("billing")) && keys1.includes("shipping")) {
            if (typeof (updateData.address.shipping) != "object" || Object.keys(updateData.address.shipping).length == 0) return res.status(400).send({ status: false, message: "Please enter shipping address in object format." })

            if (typeof (updateData.address.billing) != "object" || Object.keys(updateData.address.billing).length == 0) return res.status(400).send({ status: false, message: "Please enter billing address in object format." })


            if (!(updateData.address.billing.city)) return res.status(400).send({ status: false, message: "Please provide a proper billing city" })
            updateData.address.billing.city = updateData.address.billing.city.trim();
            if (!(updateData.address.billing.city)) return res.status(400).send({ status: false, message: "Please provide a proper billing city" })

            if (!(updateData.address.billing.street)) return res.status(400).send({ status: false, message: "Please provide a proper billing street" })
            updateData.address.billing.street = updateData.address.billing.street.trim();
            if (!(updateData.address.billing.street)) return res.status(400).send({ status: false, message: "Please provide a proper billing street" })


            if (!(updateData.address.billing.pincode)) return res.status(400).send({ status: false, message: "Please provide a proper billing pincode" })
            updateData.address.billing.pincode = JSON.parse(updateData.address.billing.pincode)
            if (!(validator.checkIndianPincode(updateData.address.billing.pincode))) return res.status(400).send({ status: false, message: "Please enter a valid 6 digit billing pincode." })

            if (!(updateData.address.shipping.city)) return res.status(400).send({ status: false, message: "Please provide a proper shipping city" })
            updateData.address.shipping.city = updateData.address.shipping.city.trim();
            if (!(updateData.address.shipping.city)) return res.status(400).send({ status: false, message: "Please provide a proper shipping city" })


            if (!(updateData.address.shipping.street)) return res.status(400).send({ status: false, message: "Please provide a proper shipping street" })
            updateData.address.shipping.street = updateData.address.shipping.street.trim();
            if (!(updateData.address.shipping.street)) return res.status(400).send({ status: false, message: "Please provide a proper shipping street" })


            if (!(updateData.address.shipping.pincode)) return res.status(400).send({ status: false, message: "Please provide a proper shipping pincode" })
            updateData.address.shipping.pincode = JSON.parse(updateData.address.shipping.pincode)
            if (!(validator.checkIndianPincode(updateData.address.shipping.pincode))) return res.status(400).send({ status: false, message: "Please enter a valid 6 digit shipping pincode." })


            const updatedUser = await userModel.findOneAndUpdate({ _id: userId }, updateData, { new: true });
            return res.status(200).send({ status: true, message: "User profile updated.", data: updatedUser })

        }

    }

    const updatedUser = await userModel.findOneAndUpdate({ _id: userId }, updateData, { new: true });
    return res.status(200).send({ status: true, message: "User profile updated.", data: updatedUser })
}catch(error){
    return res.status(500).send({status:false, Error:error.message})
}
}

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile }