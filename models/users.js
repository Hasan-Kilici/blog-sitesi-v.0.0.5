const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = new Schema({
  username: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  badgets: {
    type: Array,
    require: true,
  },
  admin: {
    type: String,
    require: true,
  },
  staff: {
    type: String,
    require: true,
  }
});

let user = mongoose.model("user", userSchema);
module.exports = user;
