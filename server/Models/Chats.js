const mongoose = require("mongoose")

const schema = new mongoose.Schema({
    senderId:String,
    receiverId:String,
    message:String,
    time:Date
})

const chat = mongoose.model("chat",schema)
module.exports=chat