const removeUploadedFiles = require('multer/lib/remove-uploaded-files');
const aws = require("aws-sdk")

//file upload API of BookCover
aws.config.update(
    {
        accessKeyId: "AKIAY3L35MCRVFM24Q7U",
        secretAccessKey: "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",
        region: "ap-south-1"
        //AWS_SDK_LOAD_CONFIG:1
    }
)
let uploadFile =  (file) => {
    return new Promise( function(resolve,reject) {
        //this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: "2006-03-01" }) //we will be using s3 service of aws
        //await uploadFile(file)
        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket", // HERE
            Key: "saloni/" + file.originalname, // HERE "radhika/smiley.jpg"
            Body: file.buffer
        }
    s3.upload(uploadParams,  function (err, data) {
            if (err) { 
                return reject({ "error": err }) 
            }
            console.log(" file uploaded succesfully ")
            return resolve(data.Location) // HERE
        }
        )
    // let data= await s3.upload(uploadParams)
    // if (data) return data.Location
    // else return "there is an error"
    }
    )
}
// const uploadImage = async function (req, res) {
//     try {
//         let files = req.files
//         if (files && files.length > 0) {
//             //upload to s3 and get the uploaded link
//             // res.send the link back to frontend/postman
//             let uploadedFileURL = await uploadFile(files[0])
//             res.status(201).send({ msg: "file uploaded succesfully", data: uploadedFileURL })
//         }
//         else {
//             res.status(400).send({ msg: "No file found" })
//         }
//     }
//     catch (err) {
//         res.status(500).send({ msg: err })
//     }
// }
module.exports = {uploadFile}