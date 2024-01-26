import React, { useEffect, useState } from 'react'
import axios from "axios"
import { BASE_URL } from '../uri'
import { useDispatch, useSelector } from 'react-redux'
import socket from '../socket'
import { clear, group } from '../Redux/Action'
import { useNavigate } from 'react-router-dom'
import gif from "./Vanilla-1s-92px.gif"

const Main = ({setlogin}) => {

const[chat, setChat]=useState(false)
const[lastSeenMap, setLastSeenMap] = useState([]);
const[chats, setChats]=useState([])
const[Userchat, setUserChat]=useState([])
const[user, setuser]=useState(null)
const[opens,setopens]=useState(null)
const[messages,setmessages]=useState([])
const[groupmessages,setgroupmessages]=useState([])
const[newmessage, setnewMessage]=useState({})
const[groupName, setGroupName] = useState('');
const[selectedMembers, setSelectedMembers] = useState([]);
const[create, setcreate]=useState(false)
const[groupchat, setgroupchat]=useState(false)
const[member,setmembers]=useState([])
const[admin,setadmin]=useState(null)
const[adds,setadd]=useState(false)
const[start,setStart]=useState(false)


const{userId}=useSelector(state=>state.item1)
const{users}=useSelector(state=>state.item2)
const{gps}=useSelector(state=>state.item3)

const dispatch = useDispatch()
const navigate = useNavigate()

const logout = async()=>{
  try {
    const response = await axios.get(`${BASE_URL}/logout`,{withCredentials:true,credentials:"include"})
    if(response.data.success){
      setlogin(false)
      socket.emit("logout",(userId))
      navigate("/")
    }
  } catch (error) {
      console.log("invalid")
  }
}


const fetch = async(name)=>{
try {
    if (!name) {
        setUserChat([]);
        return;
      }
    const response = await axios.get(`${BASE_URL}/fetch?name=${name}`,{withCredentials:true, credentials:"include"})
    if(response.data.success){
        setUserChat([...Userchat,response.data.data])
    }
    else{
        setUserChat([])
    }
} catch (error) {
  console.log("invalid")
}  
}

const handleCreateGroup = () => {
  socket.emit('createGroup', { groupName, members: [...selectedMembers, userId],Admin:userId });
  setGroupName('');
  setSelectedMembers([]);
  setcreate(false)
};

const scrollToBottom = () => {
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
};

const send = async()=>{
 socket.emit("send",newmessage)
 socket.emit("fetched",(user._id))
 setChats((prevChats) => {
  const newArray = [...prevChats];
  const index = newArray.findIndex((item) => item._id === user._id);
  if (index !== -1) {
    const update =  newArray[index].lastMessage?.map((item,i)=>{
      if(i===0){
        return { ...item, message: newmessage.message, senderId: userId };
      }
      return item
    })
    newArray[index] = {
      ...newArray[index],
      lastMessage: update,
    };
  }
  return newArray;
});
 setmessages((prevMessages) => [...prevMessages, newmessage])
 setnewMessage({senderId:"",receiverId:"",message:""})
 setTimeout(() => {
  scrollToBottom();
},0);
}


const sendgroup = async()=>{
  socket.emit("sendgroup",newmessage)
  setgroupmessages((prevMessages) => [...prevMessages, newmessage])
  setnewMessage({sender:"",message:"",groupId:""})
  setTimeout(() => {
   scrollToBottom();
 },0);
 }

const deleteE = ()=>{
  socket.emit("delete",userId,user._id)
  setmessages([])
  setChats((prevChats) => {
    const newArray = [...prevChats];
    const index = newArray.findIndex((item) => item._id === user._id);
    if (index !== -1) {
      const update =  newArray[index].lastMessage.map((item,i)=>{
        if(i===0){
          return { ...item,message:null, senderId:null , receiverId:null };
        }
        return item
      })
      newArray[index] = {
        ...newArray[index],
        lastMessage: update,
      };
    }
    return newArray;
  });
  setTimeout(()=>{
  socket.emit("fetch",userId,user._id)
},0)
}

const chatclick = (e) =>{
  setChat(true);
  setgroupchat(false)
  setuser(e);
  setmessages([])
  socket.emit("fetch",e._id,userId)
  socket.emit("lastS",e._id)
}

const groupChat = (e)=>{
  setChat(false)
  setgroupchat(true)
  setuser(e);
  socket.emit("groupdetails",e)
}

const del = ()=>{
  socket.emit("del",userId,user._id)
}

const add = () =>{
  socket.emit("add",selectedMembers,user._id,userId)
  setadd(false)
  setSelectedMembers([])
}

const groupDelete = () => {
  socket.emit("groupDelete",user._id)
  setgroupchat(false)
}

const handleItemClick = (newChatItem) => {
  setChats((prevChats) => {
    const hasDuplicate = prevChats.some(chat => chat._id === newChatItem._id);
    if (!hasDuplicate) {
      return [...prevChats, newChatItem];
    }
    return prevChats;
  });
  setUserChat([]);
};


useEffect(()=>{

socket.on("newmessage",(data,result)=>{
    setmessages((e)=>[...e,data])
    setChats((prevChats) => {
      const updatedChats = [...prevChats];
      const filt = updatedChats.filter((e)=> e._id !== result._id)
      return [...filt, result]
    })
    setTimeout(() => {
      scrollToBottom();
    },0);
})

socket.on("fetchnow",(data)=>{
  setmessages((prevMessages) => {
    const existingIds = prevMessages.map((item) => item._id);
    const uniqueData = data.filter((item) => !existingIds.includes(item._id));
    const updatedMessages = [...prevMessages, ...uniqueData];
    return updatedMessages;
  });
  setTimeout(() => {
    scrollToBottom();
  },0);
})

socket.on("fetchednow",(data)=>{
  setChats((prevChats) => {
    const updatedChats = [...prevChats];

    data.forEach((newChat) => {
      const hasDuplicate = updatedChats.some((chat) => chat._id === newChat.sender._id);

      if (!hasDuplicate) {
        updatedChats.push(newChat.sender);
      }
    });
    return updatedChats;
  });
})

socket.on("groupFetched",(data)=>{
  if (data) {
    setgroupchat(false)
    dispatch(clear())
    dispatch(group(data));
} else {
    setgroupchat(false)
    dispatch(clear());
}
})

socket.on('groupMessage', (message) => {
    setgroupmessages((prevMessages) => [...prevMessages, message]);
    setTimeout(() => {
    scrollToBottom();
  },0);
});

socket.on("groupdetailsFetch", (data) => {
  setgroupmessages([])
  setgroupmessages((prevMessages) => {
    const uniqueMessageIds = new Set(prevMessages.map((message) => message._id));
    const filteredData = data.filter((message) => !uniqueMessageIds.has(message._id));
    return [...prevMessages, ...filteredData];
  });
  setTimeout(() => {
  scrollToBottom();
},0);
});

socket.on('groupCreated', (newGroup) => {
  dispatch(group(newGroup))
});

socket.on("groupmembers",(data)=>{
  setmembers(()=>[...data])
})

socket.on("admin",(data)=>{
  setadmin(data)
})

socket.on("deletedgroup",()=>{
  socket.emit("group",userId)
})

socket.on("deleted",()=>{
  socket.emit("group",userId)
})

socket.on("added",()=>{
  socket.emit("group",userId)
})

socket.on("everyone",(Id)=>{
  setmessages([])
  setChats((prevChats) => {
    const newArray = [...prevChats];
    const index = newArray.findIndex((item) => item._id === Id);
    if (index !== -1) {
      const update =  newArray[index].lastMessage.map((item,i)=>{
        if(i===0){
          return { ...item, message:null, senderId:null , receiverId:null};
        }
        return item
      })
      newArray[index] = {
        ...newArray[index],
        lastMessage: update,
      };
    }
    return newArray;
  });
})

socket.on('updateUserList', (users) => {
  setLastSeenMap((prev)=>{
    const check = [...prev];
    const update = check.filter((e)=> e._id !== users._id )
    const newlist = [...update,users]
    return newlist
  });
});

socket.on("start",()=>{
 setStart(true)
 setTimeout(()=>{
  scrollToBottom()
 },0)
})

socket.on("stopped",()=>{
  setStart(false)
  setTimeout(()=>{
    scrollToBottom()
   },0)
})


return () => {
  socket.off("newmessage");
  socket.off("fetchnow");
  socket.off("fetchednow");
  socket.off("groupFetched")
  socket.off("groupMessage")
  socket.off("groupdetailsFetch")
  socket.off("groupCreated")
  socket.off("groupmembers")
  socket.off("admin")
  socket.off("deletedgroup")
  socket.off("deleted")
  socket.off("added")
  socket.off("everyone")
  socket.off("updateUserList")
  
};

},[socket])

const formatDateLabel = (timestamp) => {
  const messageDate = new Date(timestamp);

  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  };

  const formattedMessageDate = messageDate.toLocaleString('en-IN', options).split(',')[0];
  const formattedTodayDate = new Date().toLocaleString('en-IN', options).split(',')[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const formattedYesterdayDate = yesterdayDate.toLocaleString('en-IN', options).split(',')[0];

  if (formattedMessageDate === formattedTodayDate) {
    return "Today";
  } else if (formattedMessageDate === formattedYesterdayDate) {
    return "Yesterday";
  } else {
    return formattedMessageDate;
  }
};
let lastDisplayedDate = null;
let lastDate = null;


const time = new Date();

  return (
    <div className='chatMain'>
        <div className='chatMain2'>
      
      {!create ?(
        <div className='nameList'>
        <i onClick={()=>logout()} class="fa-solid fa-arrow-right-from-bracket logout"></i>
          <div className='listSearch'>
         
          <input onChange={(e)=>{const value = e.target.value.toLowerCase(); fetch(value)}} placeholder='Search'></input>
          <i class="fa-solid fa-magnifying-glass"></i>

          {Userchat?.map((e)=>(
          <div onClick={()=>handleItemClick(e)} className='searchlist'>
            <i class="fa-solid fa-user"></i>
            <h3>{e.name[0].toUpperCase()+e.name.slice(1)}</h3>
          </div>
          ))}
          
          </div>

          <div className='chatListMain'>
        {chats && chats.length > 0 ? (
          chats.map((e)=>(
          <div onClick={()=>chatclick(e)} className='chatlist'>
            <i class="fa-solid fa-user"></i>
            <h3>{e?.name[0].toUpperCase()+e?.name.slice(1)}</h3>
            {!chat && (
            <p>{e.lastMessage?.map((q)=> q.senderId === userId ? `You: ${q.message}` : q.receiverId ? `${e.name}: ${q.message}`: "")}</p>
            )}
          </div>
          ))
          ):null}

        {gps && gps.length > 0 && (
           gps.map((e)=>(
          <div onClick={()=>groupChat(e)} className='chatList'>
           <i class="fa-solid fa-user-group"></i>
            <h3>{e.groupName[0].toUpperCase()+e.groupName.slice(1)}</h3>
          </div>
          ))
          )}
          
          </div>
          <i onClick={()=>setcreate(!create)} class="fa-solid fa-user-group makegrp"></i>
        </div>
      ):(
      <div className='namelist'>
      <h2>Create Group</h2>
      <label>Group Name:</label>
      <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} required/>

      <h3>Select Members:</h3>
      <ul>
        {users.map((user) => {
          if(user._id === userId){
            return (
              <li style={{marginLeft:"2rem",textTransform:"none"}} key={user._id}>You</li>
          )}
          else{
            return(
            <li key={user._id}>
            <input
              type="checkbox"
              checked={selectedMembers.includes(user._id)}
              onChange={() => {
                if (selectedMembers.includes(user._id)) {
                  setSelectedMembers((prev) => prev.filter((id) => id !== user._id));
                } else {
                  setSelectedMembers((prev) => [...prev, user._id]);
                }
              }}
            />
            {user.name[0].toUpperCase()+user.name.slice(1).toLowerCase()}
          </li>
            )
          }
          
          
          })}
      </ul>
      <button onClick={handleCreateGroup}>Create Group</button>
      <i onClick={()=>setcreate(!create)} class="fa-solid fa-user-group makegrp"></i>
    </div>
    )}
<div className='chatArea'>
       
{chat ? (
            <>
          <i onClick={() => setopens(!opens)} className="fa-solid fa-ellipsis-vertical three"></i>
          {opens?(
            <div onClick={()=>{deleteE(); setopens(false);}} className='deleteE'>Delete chat for everyone</div>
          ):null}
          <div className='chatArea2'>
            <i class="fa-solid fa-user usr"></i>
            <h3>{user.name[0].toUpperCase()+user.name.slice(1)}</h3>
            <p> {lastSeenMap.map((e) => {
              if(e._id === user._id && e.lastSeen === null){
                  return "Online"
              }
              else if(e._id === user._id){
                const lastseen = new Date(e.lastSeen)
                return `Last seen ${lastseen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              }})}</p>
          </div>

    <div id="chat-container" className='chat'>
      {messages && messages.length > 0 ? ( 
       messages.map((e)=>{
        let type;
        if(e.senderId === userId){
          type = "sender"

          const displayDateLabel = lastDisplayedDate !== new Date(e.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }).split(',')[0];
          lastDisplayedDate = new Date(e.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }).split(',')[0];
          
          return(
          <div className={type}>
          {displayDateLabel && <span style={{fontSize:"16px"}} className='mssgDate2'>{formatDateLabel(e.time)}</span>}
          <p>{e.message}<span>{e.time ? new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span></p>
          </div>
          )
        }
        else{
          type = "receiver"

          const displayDateLabel = lastDisplayedDate !== new Date(e.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }).split(',')[0];
          lastDisplayedDate = new Date(e.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }).split(',')[0];

          return(
          <div className={type}>
          {displayDateLabel && <span className='mssgDate'>{formatDateLabel(e.time)}</span>}
          <p><span className='span'>{e.time ? new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span> {e.message}</p>
          </div>
          )
        }
          
       })):null}
       <div style={{display: start ? "flex" : "none"}} className='receiver'>
       <img alt='loading..' style={{position:"absolute",left:"1rem",marginBottom:"0",backgroundColor: "#ffffff73",height:"56%",borderRadius: "0 20px 20px 20px"}} src={gif}/>
       </div>
          </div>
          <div className='message'>
          <input value={newmessage?.message} onFocus={()=>socket.emit("typing",user._id)} onBlur={()=>socket.emit("stop",user._id)} onChange={(e)=>setnewMessage({...newmessage,senderId:userId,receiverId:user._id,message:e.target.value,time:time})} className='textnow' placeholder='Type a message'></input>
          <i onClick={send} class="fa-solid fa-paper-plane send"></i>
          </div>
       </>
): groupchat ? (
   <>
    <i onClick={() => setopens(!opens)} className="fa-solid fa-ellipsis-vertical three"></i>
   
    {opens?(
      <div style={{backgroundColor:"#406e6f",color:"azure"}} onClick={()=>setopens(false)} className='deleteE'>Members:-
      {member?.map((e)=>(
        <li>{e[0].toUpperCase()+e.slice(1).toLowerCase()}</li>
      ))}

      {admin !==userId &&(
      <i onClick={()=>del()} class="fa-solid fa-arrow-right-from-bracket"></i>
      )}
      {admin===userId && (
        <button onClick={()=>groupDelete()} className='delgrp'>Delete Group</button>
      )}
      </div>
    ):null}
    <div style={{backgroundColor:"#406e6f"}} className='chatArea2'>
    <i  class="fa-solid fa-user-group"></i>
      <h3>{user.groupName[0].toUpperCase()+user.groupName.slice(1)}</h3>  

{admin === userId && (
<>
<i onClick={()=>setadd(!adds)} style={{position:"absolute",right:"3rem"}} class="fa-solid fa-plus"></i>
{adds &&(
<div className='addpart'>
{users.map((us) => {
  let hasMatch = false;

  member.forEach((e) => {
    if (e.toLowerCase() === us.name.toLowerCase()) {
      hasMatch = true;
    }
  });

  if (hasMatch) {
    return null
  }

  return (
    <ul key={us._id}>
      <li key={us._id}>
        <input
          type="checkbox"
          checked={selectedMembers.includes(us._id)}
          onChange={() => {
            if (selectedMembers.includes(us._id)) {
              setSelectedMembers((prev) => prev.filter((id) => id !== us._id));
            } else {
              setSelectedMembers((prev) => [...prev, us._id]);
            }
          }}
        />
        {us.name[0].toUpperCase() + us.name.slice(1).toLowerCase()}
      </li>
    </ul>
  );
})}
<i onClick={()=>add()} class="fa-solid fa-circle-plus"></i>
</div> 
)}
</>
)}



    </div>

<div id="chat-container" className='chat'>
  {groupmessages && groupmessages.length > 0 ? ( 
   groupmessages.map((e)=>{
  let type;
  if(e.sender === userId){
    type = "sender"

  
    const displayLabel = lastDate !== new Date(e.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }).split(',')[0];
    lastDate = new Date(e.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }).split(',')[0];

    return(
    <div className={type}>
    {displayLabel && <span style={{fontSize:"16px"}} className='mssgDate2'>{formatDateLabel(e.time)}</span>}
    <p>{e.message}<span>{e.time ? new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span></p>
    </div>
    )
  }
  else{
    type = "receiver"

    const displayLabel = lastDate !== new Date(e.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }).split(',')[0]
    lastDate = new Date(e.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }).split(',')[0];;

    return(
    <div className={type}>
    {displayLabel && <span className='mssgDate'>{formatDateLabel(e.time)}</span>}
    <span className='sp'>{e.name}</span>
    <p><span className='span'>{e.time ? new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span> {e.message}</p>
    </div>
    )
  }
    
 })):null}
     
    </div>
    <div className='message'>
    <input value={newmessage?.message} onChange={(e)=>setnewMessage({...newmessage,sender:userId,message:e.target.value,time:time,groupId:user._id})} className='textnow' placeholder='Type a message'></input>
    <i onClick={sendgroup} class="fa-solid fa-paper-plane send"></i>
    </div>
    </>
 ):(
          <div className='chatArea3'>
           <p>Select user to chat</p>
          </div>
          )}
        </div>
        </div>
    </div>
  )
}


export default Main

