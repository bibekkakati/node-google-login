const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: String,
  googleid: String
});

module.exports = User = mongoose.model("user", UserSchema);
