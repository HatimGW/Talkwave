const userId = null;
const users = []
const gps = []

export const Reducer1 = (state={userId},action)=>{
    switch (action.type) {
        case "success":
            return {userId:action.payload}
        default:
            return state;
    }
}
export const Reducer2 = (state={users},action)=>{
    switch (action.type) {
        case "userfind":
            return {users:action.payload}
        default:
            return state;
    }
}
export const Reducer3 = (state={gps},action)=>{
    switch (action.type) {
        case "groupfind":
            const payloadArray = Array.isArray(action.payload) ? action.payload : [action.payload];
            return {gps:[...state.gps,...payloadArray]}
        case "groupclear":
            return {gps:[]}
        default:
            return state;
    }
}