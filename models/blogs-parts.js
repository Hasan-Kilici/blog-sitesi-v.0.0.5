const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let blogsPartsSchema = new Schema(
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
    blogId: {
      type: String,
      require: true,
    },
  },
  { timestamp: true }
);

let blogsParts = mongoose.model("Blogs-Part", blogsPartsSchema);
module.exports = blogsParts;
