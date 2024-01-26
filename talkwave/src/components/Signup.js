import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BASE_URL } from '../uri'

const Signup = ({setSuccess,setFailed}) => {

    const[Data, setData]= useState({})

    const navigate = useNavigate()

    const signup = async(e)=>{
        e.preventDefault()
        try {
            const response = await axios.post(`${BASE_URL}/signup`,Data,{withCredentials:true,credentials:"include"})
            if(response.data.success){
                setSuccess(true)
                navigate("/")
                setTimeout(()=>{
                    setSuccess(false)
                },2000)
            }
            else if(response.data.failed){
                setFailed(true)
                setTimeout(()=>{
                    setFailed(false)
                },2000)
            }
        } catch (error) {
            setFailed(true)
            setTimeout(()=>{
                setFailed(false)
            },2000)
        }
    }

  return (
    <section>
    <h2>Signup</h2>
            <form>
                <div className='group'>
                <label>Name</label>
                <input value={Data.name} onChange={(e)=>setData({...Data,name:e.target.value})} type='text' placeholder='Name'></input>
                </div>

                <div className='group'>
                <label>Email</label>
                <input value={Data.email} onChange={(e)=>setData({...Data,email:e.target.value})} type='email' placeholder='Email'></input>
                </div>
                
                <div className='group'>
                <label>Mobile Number</label>
                <input value={Data.number} onChange={(e)=>setData({...Data,number:e.target.value})} type='number' placeholder='Mobile Number'></input>
                </div>

                <div className='group'>
                <label>Password</label>
                <input value={Data.password} onChange={(e)=>setData({...Data,password:e.target.value})} type='password' placeholder='Password'></input>
                </div>
            
                <div className='groupBtn'>
                <button onClick={signup}>Signup</button>
                </div>

                <div className='groupBtn'>
                <Link className='Link' to="/">Already Signup?</Link>
                </div>

            </form>
    </section>
  )
}

export default Signup