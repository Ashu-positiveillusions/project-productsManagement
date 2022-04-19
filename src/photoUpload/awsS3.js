const removeUploadedFiles = require('multer/lib/remove-uploaded-files');
const aws = require("aws-sdk")


aws.config.update(
    {
        accessKeyId: "AKIAY3L35MCRVFM24Q7U",
        secretAccessKey: "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",
        region: "ap-south-1"
        
    }
)
let uploadFile =  (file) => {
    return new Promise( function(resolve,reject) {
        
        let s3 = new aws.S3({ apiVersion: "2006-03-01" })
        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "saloni/" + file.originalname, 
            Body: file.buffer
        }
    s3.upload(uploadParams,  function (err, data) {
            if (err) { 
                return reject({ "error": err }) 
            }
            console.log(" file uploaded succesfully ")
            return resolve(data.Location) 
        }
        )
    }
    )
}

module.exports = {uploadFile}