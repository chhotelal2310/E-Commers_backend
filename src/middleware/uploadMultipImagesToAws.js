const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

const uploadMulipleImages = async (req, res, next) => {
  try {
    if (req.files.length < 1) {
      throw new Error("at least 1 images needed!");
    }
    let productImage = [];
    const BUCKET_NAME = process.env.BUCKET_NAME;
    for (let i = 0; i < req.files.length; i++) {
      const params = {
        Bucket: BUCKET_NAME,
        Key: req.files[i].originalname,
        Body: req.files[i].buffer,
        ContentType: req.files[i].mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      const imgUrl = `https://${params.Bucket}.s3.ap-southeast-2.amazonaws.com/${params.Key}`;
      productImage.push(imgUrl);
    }
    req.productImage = productImage;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = uploadMulipleImages;
