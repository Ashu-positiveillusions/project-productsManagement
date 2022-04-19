const jwt = require("jsonwebtoken");

const authenticationUser = function(req,res,next)
{
//try {

    let token1 = req.header("Authorization")
    if (!token1) return res.status(400).send({ status: false, message: "token must be present" });
    token1 = token1.split(" ")
    const token = token1[1];

    //verifying token with secret key
    const decodedToken = jwt.verify(token, "products-management-project");    
    if (!decodedToken)
        return res.status(401).send({ status: false, message: "token is invalid" });//validating token value inside decodedToken
        //console.log(decodedToken)

    const loggedInUser=decodedToken.userId;
    req.headers["userid"]=loggedInUser
    next();
// }
// catch(error)
// {
// res.status(500).send({message:"Error", Error:error.message})
// }
}

module.exports.authenticationUser = authenticationUser;

