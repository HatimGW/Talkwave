const mongoose = require("mongoose")

const schema = new mongoose.Schema({
    name:{
        type:String,
        unique:true
    },
    email:{
        type:String,
        unique:true
    },
    number:Number,
    password:String,
    lastSeen:Date
})

const User = mongoose.model("User",schema)

module.exports=User;