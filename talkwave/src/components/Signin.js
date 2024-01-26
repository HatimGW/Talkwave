import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BASE_URL } from '../uri'
import { useDispatch} from 'react-redux'
import { UserId, Users } from '../Redux/Action'
import socket from '../socket'

const Signin = ({setlogin,setloginSuccess,setloginFailed}) => {

    const[LoginData,setLoginData]=useState({})


    const navigate = useNavigate()
    const dispatch = useDispatch()

    const Login = async(e)=>{
        e.preventDefault()
        try {
            const response = await axios.post(`${BASE_URL}/login`,LoginData,{withCredentials:true,credentials:"include"})
            if(response.data.success){
                socket.emit("login",(response.data.userId))
                socket.emit("fetched",(response.data.userId))
                dispatch(UserId(response.data.userId))
                dispatch(Users(response.data.usersData))
                socket.emit("group",response.data.userId)
                setlogin(response.data.success)
                setloginSuccess(true)
                navigate("/")
                setTimeout(()=>{
                    setloginSuccess(false)
                },2000)
            }
            else if(response.data.fail){
                setlogin(false)
                setloginFailed(true)
                setTimeout(()=>{
                    setloginFailed(false)
                },2000)
            }
        } catch (error) {
            setloginFailed(true)
            setTimeout(()=>{
                setloginFailed(false)
            },2000)
        }
    }


  return (
    <section>
          <h2>Login</h2>
            <form>
                <div className='group'>
                <label>Email</label>
                <input value={LoginData.email} onChange={(e)=>setLoginData({...LoginData,email:e.target.value})} placeholder='Email'></input>
                </div>
                

                <div className='group'>
                <label>Password</label>
                <input value={LoginData.password} onChange={(e)=>setLoginData({...LoginData,password:e.target.value})} placeholder='Password'></input>
                </div>
            
                <div className='groupBtn'>
                <button onClick={Login}>Login</button>
                </div>

                <div className='groupBtn'>
                <Link className='Link' to="/signup">Not have an account?</Link>
                </div>

            </form>
    </section>
  )
}

export default Signin