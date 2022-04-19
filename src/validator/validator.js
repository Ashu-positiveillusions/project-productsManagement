var ObjectId = require("mongoose").Types.ObjectId;

const isValidObjectId= function (a){
    if((ObjectId.isValid(a)))//checking for 12 bytes id in input value 
    {  
        let b =  (String)(new ObjectId(a))//converting input value in valid object Id
        
        if(b == a) //comparing converted object Id with input value
        {       
            return true
        }else{
                return false;
            }
    }else{
        return false
    }
}

const isValid=function(valid){
    if(valid==null){
        return false }   
            //because findOne etc. returns null if no object found
    if(typeof(valid)=="string"){          //checking if valid is empty space or empty string
        if(!valid) return false
        if(!valid.trim()) return false
    }
    if(Array.isArray(valid)){
        if(valid.length==0) return false
    }
    return true
}

const checkValidEmail = function (email){
    var emailRegex =/^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
    if(emailRegex.test(email)) {
        return true
    }
    return false
}

const checkIndianNumber= function(b){  
    var a = /^[6-9]\d{9}$/gi;  
        if (a.test(b))   
        {  
            return true;  
        }   
        else   
        {  
            return false; 
        }  
};

const checkIndianPincode= function(b){  
    var a = /^\d{6}$/gi;  
        if (a.test(b))   
        {  
            return true;  
        }   
        else   
        {  
            return false; 
        }  
};
module.exports={ isValidObjectId, isValid, checkIndianNumber, checkValidEmail, checkIndianPincode }
