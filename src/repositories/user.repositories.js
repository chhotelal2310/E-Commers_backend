const User = require("../models/user.model");
const bcryptjs = require("bcryptjs");
class userRepo {
  async createUser(data) {
    const user = await User.create(data);
    await user.save();
    return user;
  }
  async findByEmail(email) {
    const existingUser = await User.findOne({ email });
    return existingUser;
  }
  async comparePassword(email, passWord) {
    const existingUser = await User.findOne({ email });
    if (!existingUser || !existingUser.passWord) return false;
    const isMatch = await bcryptjs.compare(passWord, existingUser.passWord);
    return isMatch;
  }
  async addProfileImageUrl(url, email) {
    const user = await User.findOne({ email });
    user.profileImage = url;
    await user.save();
  }
  async updateUserDetails(req) {
    return await User.findByIdAndUpdate(req?.user?._id, req.body, {
      new: true,
      runValidators: true,
    });
  }
  async findUserById(userId) {
    return await User.findById(userId);
  }
}

module.exports = new userRepo();
