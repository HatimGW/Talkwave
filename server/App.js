const express = require("express")
const app = express()
const User = require("./Models/signup")
const chat = require("./Models/Chats")
const socketIO = require("socket.io")
const http = require("http")
const server = http.createServer(app)
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const GroupChat = require("./Models/group")
const cookieParser = require("cookie-parser")
const { lstat } = require("fs")
require("dotenv").config()
app.use(express.json());
app.use(cookieParser())

const io = socketIO(server,{
    cors:{
        origin:"https://talkwave53.netlify.app",
        credentials:true
    }
})

// const io = socketIO(server,{
//     cors:{
//         origin:"http://localhost:3000",
//         credentials:true
//     }
// })
const PORT = process.env.PORT || 3001

require("./db/connection")

app.use(cors({
origin:"https://talkwave53.netlify.app",
credentials:true
}))

// app.use(cors({
//     origin:"http://localhost:3000",
//     credentials:true
//     }))

io.on("connection", (socket) => {

    socket.on("login",async(Id)=>{
        socket.join(Id)
      await User.findOneAndUpdate(
            {_id:Id},
            {lastSeen:null}
            )
        const check = await User.findOne({_id:Id})
        const{_id,lastSeen}=check;
        const map = {_id,lastSeen}
        io.emit('updateUserList', map);
    })

    socket.on("send",async(data)=>{
        const{senderId,receiverId,message,time}=data
        await chat.create({
         senderId,receiverId,message,time
        })

        const lastMessage = await chat.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: receiverId },
                        { receiverId: receiverId },
                    ]
                }
            },
            {
                $sort: { time: -1 }
            },
            {
                $limit: 1
            }
        ]);
        const name = await User.findOne({_id:senderId})

        const result = {
            _id:senderId,
            name: name.name,
            lastMessage: lastMessage ? lastMessage : null,
        }
        io.to(receiverId).emit("newmessage",data,result)
    })

    socket.on("fetch",async(receiverId,senderId)=>{
       const data = await chat.aggregate([
        {
            $match:{
                $or: [
                    { senderId: receiverId, receiverId: senderId },
                    { senderId: senderId, receiverId: receiverId }
                ]
            }
        }
        ]).exec()
       io.to(senderId).emit("fetchnow",data)
    })

    socket.on("fetched",async(Id)=>{
        const data = await chat.aggregate([
            {
                $match:{
                    $or: [
                        { senderId: Id },
                        { receiverId: Id }
                    ]
                }
            }
            ]).exec()
            
        const uniquePairs = new Set();

        const processedData = data.map(async(e) => {

        const senderId = e.receiverId === Id ? e.senderId : e.receiverId;
            
        const pairKey = `${senderId}`;

        if (!uniquePairs.has(pairKey)) {
          
            uniquePairs.add(pairKey);

            const senderUser = await User.findOne({ _id: senderId });
             
            const{_id,name}=senderUser;

            const lastMessage = await chat.aggregate([
                {
                    $match: {
                        $or: [
                            { senderId: Id },
                            { receiverId: Id },
                        ]
                    }
                },
                {
                    $sort: { time: -1 }
                },
                {
                    $limit: 1
                }
            ]);
            const result = {
                _id,
                name,
                lastMessage: lastMessage ? lastMessage : null,
            }
            return {
                sender: result,
            };
        }
        return null;
            
    });
      const filteredData = (await Promise.all(processedData)).filter(pair => pair !== null);
      io.to(Id).emit("fetchednow", filteredData)   
    })

    socket.on("delete",async(senderId,receiverId)=>{
      const check = await chat.aggregate([
        {
            $match:{
                $or:[
                    {senderId:senderId,receiverId:receiverId},
                    {senderId:receiverId,receiverId:senderId}
                ]
            }
        }
      ]).exec()
      const name = await User.findOne({_id:senderId})
      if(check.length>0){
        const chatIds = check.map((e) => e._id);
        await chat.deleteMany({ _id: { $in: chatIds } });
        
        io.to(receiverId).emit("everyone",senderId)
      }
      else{
        console.log("error")
      }
    })

    socket.on('createGroup', async ({ groupName, members,Admin }) => {
        try {
          const newGroupChat = await GroupChat.create({
            groupName,
            messages: [],
            members,
            Admin
          });

          members.forEach((member) => {
              io.to(member).emit('groupCreated', newGroupChat);
          });
    
        } catch (error) {
          console.error('Error creating group chat:', error);
        }
      });
    
    socket.on("group",async(Id)=>{
        try {
            const check = await GroupChat.find({ members: Id });
            if(check){
                socket.emit("groupFetched",check)
            }
            else{
                socket.emit("groupFetched")
            }
        } catch (error) {
            console.log(error)
        }
    })

    socket.on("groupdetails",async(data)=>{
       const check = await GroupChat.findOne({_id:data._id})
        
       if (check) {
        const memberIds = check.members;
        const memberNames = await Promise.all(
          memberIds.map(async (userId) => {
            const user = await User.findById(userId);
            return user ? user.name : null;
          }))
        socket.emit("groupdetailsFetch",check.messages)
        socket.emit("admin",check.Admin)
        socket.emit("groupmembers", memberNames)
       }
       else{
        console.log("error")
       }

    })

    socket.on("sendgroup",async(data)=>{
        const{sender,message,time,groupId}=data
        try {
            const group = await GroupChat.findOne({ _id: groupId});

            const check = await User.findOne({_id:sender})
            if (group) {
              group.messages.push({ name: check.name, sender, message, time });
              await group.save();
              group.members.forEach((member) => {
                
                if(check && member !== sender){
                  io.to(member).emit("groupMessage", { name: check.name, sender, message, time });
                }
              });
        } 
    } catch (error) {
            console.log(error)
        }
    })

    socket.on("del",async(Id,id)=>{
        try {
          await GroupChat.updateOne(
              {_id: id },
              { $pull: { members: { $in: [Id] } } }
            );
            io.to(Id).emit("deleted")

            const check = await GroupChat.findOne({_id:id})
            
            const memberIds = check.members;
            const memberNames = await Promise.all(
            memberIds.map(async (userId) => {
              const user = await User.findById(userId);
              return user ? user.name : null;
            }))
            
            check.members.forEach((mem)=>{
                io.to(mem).emit("groupmembers",memberNames)
            })

          } catch (error) {
            console.error("Error removing user from the group:", error);
          }
    })

    socket.on("groupDelete",async(grpId)=>{
         try {
            const group = await GroupChat.findOne({_id:grpId})
            const member = group ? group.members : [];
            await GroupChat.deleteOne({_id:grpId})

            member.forEach((mem)=>{
                io.to(mem).emit("deletedgroup")
            })

         } catch (error) {
            console.log(error)
         }
    })

    socket.on("add",async(data,id,userid)=>{
        try {
            await GroupChat.updateOne(
                {_id:id},
                {
                 $push :{members : data}
                }
            )

        const check = await GroupChat.findOne({_id:id})
         const memberIds = check.members;
          const memberNames = await Promise.all(
          memberIds.map(async (userId) => {
            const user = await User.findById(userId);
            return user ? user.name : null;
          }))
         
          io.to(userid).emit("groupmembers",memberNames)

            data.forEach((mem)=>{
                io.to(mem).emit("added")
            })
           
        } catch (error) {
            console.log(error)
        }
    })

    socket.on("lastS",async(Id)=>{
        const check = await User.findOne({_id:Id})
        const{_id,lastSeen}=check
        const map = {_id,lastSeen}
        io.emit('updateUserList', map);
    })

    socket.on("typing",(Id)=>{
        io.to(Id).emit("start")
    })

    socket.on("stop",(Id)=>{
        io.to(Id).emit("stopped")
    })

    socket.on("logout",async(Id)=>{
        const lastSeens = new Date();
        await User.findOneAndUpdate(
            {_id:Id},
            {lastSeen:lastSeens}
        )
        const check = await User.findOne({_id:Id})
        const{_id,lastSeen}=check
        const map = {_id,lastSeen}
        io.emit('updateUserList', map);
    })
 
})



const Authentication = async(req,res,next)=>{
    const token = req.cookies.token
    if(!token){
        res.status(400).json({success:false})
    }
    else{
        const decoded = jwt.verify(token,process.env.jwt_secret)
        req.Id = decoded.Id
        req.email = decoded.email
        next()
    }
}

const clear = async(req,res,next)=>{
   res.clearCookie("token",{httpOnly:true,secure:true,sameSite:"None"})
   next()
}

app.get("/logout",clear,async(req,res)=>{
    res.status(200).json({success:true})
})

app.post("/signup", async(req,res)=>{

    const{name,email,number,password} = req.body
    try {
        if(!name || !email || !number || !password){
            res.status(400).json({success:false})
        }
        const Name = name.toLowerCase()
        const check = await User.findOne({email})
        if(!check){
          const hashed = await bcrypt.hash(password,10)
          await User.create({
            name:Name,email,number,password:hashed
          })
          res.status(200).json({success:true})
        }
        else{
          res.json({failed:true})
        }
    } catch (error) {
        res.status(500).json({message:"fail"})
    }
})


app.post("/login", async(req,res)=>{
    const{email,password}=req.body
    try {
        const check = await User.findOne({email})
        if(check){
            const compare = await bcrypt.compare(password,check.password)
            if(compare){
                const token = jwt.sign({email:check.email,Id:check._id},process.env.jwt_secret,{expiresIn:"1h"})
                const usersData = await User.find().select("_id name")
                res.cookie("token",token,{httpOnly:true,secure:true,sameSite:"None",maxAge:3600000})
                res.status(200).json({usersData:usersData,userId:check._id,success:true})
            }
            else{
                res.json({fail:true})
            }
        }
        else{
            res.status(400).json({success:false})
        }
    } catch (error) {
        res.status(400).json({success:false})
    }
})

app.get("/fetch",async(req,res)=>{
    const{name}=req.query
    try {
        const check = await User.findOne({name})
        if(check){
            const { _id, name } = check;
            const result = { _id, name, lastMessage:[{senderId:null,message:null,receiverId:null}]};
            res.status(200).json({success:true, data:result})
        }
        else{
            res.status(400).json({success:false})
        }
    } catch (error) {
        res.status(400).json({success:false})
    }
})

app.get("/check", Authentication, async(req,res)=>{
   const usersData = await User.find().select("_id name")
   res.status(200).json({userId:req.Id,success:true,usersData:usersData})
})

server.listen(PORT)