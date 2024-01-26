export const UserId = (payload)=>({
    type:"success",
    payload
})

export const Users = (payload)=>({
    type:"userfind",
    payload
})
export const group = (payload)=>({
    type:"groupfind",
    payload
})
export const clear = ()=>({
    type:"groupclear"
})
