const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let blogsSchema = new Schema(
  {
    title: {
      type: String,
      require: true,
    },
    description: {
      type: String,
      require: true,
    },
    photo: {
      type: String,
      require: true,
    },
    tags: {
      type: Array,
      require: true,
    },
    comments: {
      type: Number,
      require: true,
    },
    staffId: {
      type: String,
      require: true,
    },
    staff: {
      type: String,
      require: true,
    },
    admin: {
      type: String,
      require: true,
    },
    adminId: {
      type: String,
      require: true,
    },
  },
  { timestamp: true }
);

let blogs = mongoose.model("Blogs", blogsSchema);
module.exports = blogs;
