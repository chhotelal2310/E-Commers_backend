const s3 = require("../config/s3");
const userRepositories = require("../repositories/user.repositories");
const {
  trackOtpRequests,
  checkOtpRestriction,
  sendOtp,
  verifyOtp,
  isEmailVerified,
  cleanup,
} = require("../utils/authHelper");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
class userService {
  async createUser(userData) {
    const user = await userRepositories.findByEmail(userData?.email);
    if (user) {
      throw new Error("Email Already exists!");
    }
    const isVerified = await isEmailVerified(userData.email);

    if (!isVerified) {
      throw new Error("Please verify your email first");
    }
    const hashedPassword = await bcryptjs.hash(userData.passWord, 10);
    userData.passWord = hashedPassword;
    const newUser = await userRepositories.createUser(userData);
    await cleanup();
    return newUser;
  }

  async sendEmailOtpVerification(email) {
    await checkOtpRestriction(email);
    await trackOtpRequests(email);
    await sendOtp(email);
  }

  async verifyEmail(email, otp) {
    await verifyOtp(email, otp);
  }

  async loginUser(email, passWord) {
    const user = await userRepositories.findByEmail(email);
    if (!user) {
      throw new Error("User Not Found !");
    }
    const isMatch = await userRepositories.comparePassword(email, passWord);
    if (!isMatch) {
      throw new Error("Invalid Email/Pass");
    }
    const accessToken = jwt.sign(
      { userId: user._id, role: "user" },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15min" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: "user" },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    return {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.fullName,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async uploadProfileImage(req) {
    const BUCKET_NAME = process.env.BUCKET_NAME;
    const params = {
      Bucket: BUCKET_NAME,
      Key: req.file.originalname,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    const imgUrl = `https://${params.Bucket}.s3.ap-southeast-2.amazonaws.com/${params.Key}`;

    await userRepositories.addProfileImageUrl(imgUrl, req.body.email);
  }
  async updateUserDetails(req) {
    const user = await userRepositories.findUserById(req?.user?._id);
    if (!user) {
      throw new Error("User Not Found ! Invalid Request.");
    }
    const updatedUser = await userRepositories.updateUserDetails(req);
    if (!updatedUser) {
      throw new Error("Something Went Wron During Updating Fields!");
    }
    return updatedUser;
  }

  async loginOrSignupWithGoogle(payload) {
    const { email, given_name, family_name, picture, sub: googleId } = payload;
    let user = await userRepositories.findByEmail(email);

    if (user) {
      // User exists, update googleId if not present (optional, but good for linking)
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save(); 
      }
    } else {
      // Create new user
      user = await userRepositories.createUser({
        email,
        firstName: given_name,
        lastName: family_name,
        profileImage: picture,
        googleId,
        passWord: "", // Or handled by model default/optional
        // isVerified: true // Assuming google users are verified. 
        // Note: The current createUser flow checks isEmailVerified. 
        // We might need to bypass that or manually set verified status if your system tracks it.
        // Looking at createUser:
        /*
        const isVerified = await isEmailVerified(userData.email);
        if (!isVerified) { throw new Error("Please verify your email first"); }
        */
        // This suggests I should NOT use createUser for Google users if it enforces email verification check via that helper.
        // Instead, I should call repository directly or bypass the check.
        // Let's create a specific method in repo or just use repository.createUser if it's simple.
        // userRepositories.createUser just calls User.create.
        // But userService.createUser has the check.
        // So I should call userRepositories.createUser directly here.
      });
    }

    // Generate tokens (copied from loginUser)
    // Detailed payload to support frontend initializeAuth
    const tokenPayload = {
      userId: user._id,
      role: "user",
      email: user.email,
      name: user.fullName || `${user.firstName} ${user.lastName}`,
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15min" }
    );

    const refreshToken = jwt.sign(
      tokenPayload, // Good practice to keep payload consistent
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    return {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.fullName,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }
}

module.exports = new userService();
