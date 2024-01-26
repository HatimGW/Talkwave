import './App.css';
import Main from './components/Main';
import {Routes, Route} from "react-router-dom"
import Signup from './components/Signup';
import Signin from './components/Signin';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from './uri';
import { useDispatch } from 'react-redux';
import { UserId, Users } from './Redux/Action';
import socket from './socket';
import { useMediaQuery } from 'react-responsive';

function App() {

const[login, setlogin]= useState(false)
const[success,setSuccess]=useState(false)
const[fail,setFailed]=useState(false)
const[loginsuccess,setloginSuccess]=useState(false)
const[loginfail,setloginFailed]=useState(false)
const dispatch = useDispatch()

const isDesktop = useMediaQuery({ minWidth: 900 });

const check = async()=>{
  try {
    const response = await axios.get(`${BASE_URL}/check`,{withCredentials:true,credentials:"include"})
    if(response.data.success){
      socket.emit("login",(response.data.userId))
      dispatch(UserId(response.data.userId))
      dispatch(Users(response.data.usersData))
      socket.emit("fetched",(response.data.userId))
      socket.emit("group",response.data.userId)
      setlogin(response.data.success)
    }
    else{
      setlogin(false)
    }
  } catch (error) {
    setlogin(false)
  }
}

useEffect(()=>{
  check()
},[])

  return (
    <>

    {isDesktop && (
<>
    {success?(
      <div className='success'>
       <p>Signedup Successfully</p>
       </div>
    ):null}
    {fail?(
      <div className='failed'>
      <p>Username or email already exist or invalid credentials</p>
      </div>
    ):null}
    {loginsuccess?(
      <div className='success'>
       <p>Logged In</p>
       </div>
    ):null}
    {loginfail? (
      <div className='failed'>
      <p>invalid credentials</p>
      </div>
    ):null}

   <Routes>
{!login?(
    <>
    <Route path='/signup' element={<Signup setFailed={setFailed} setSuccess={setSuccess}/>}></Route>
    <Route path='/' element={<Signin setloginSuccess={setloginSuccess} setloginFailed={setloginFailed} setlogin={setlogin}/>}></Route>
    </>
    ):(
      <Route path='/' element={<Main setlogin={setlogin}/>}></Route>
    )}
    
    
   </Routes>
   </>
   
  )}

  {!isDesktop && (
        <div className="background">
          <h2 className="mess">Designed for desktop viewing</h2>
        </div>
    )}
  </>
  )
}

export default App;
