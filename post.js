const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user:{ type:mongoose.Schema.Types.ObjectId, ref:"User" },
  text:String
},{timestamps:true});

const postSchema = new mongoose.Schema({
  caption:String,
  image:String,
  user:{ type:mongoose.Schema.Types.ObjectId, ref:"User" },

  likes:[{ type:mongoose.Schema.Types.ObjectId, ref:"User" }],

  comments:[commentSchema]

},{timestamps:true});

module.exports = mongoose.model("Post",postSchema);