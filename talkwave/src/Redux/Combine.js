import {combineReducers} from "redux"
import { Reducer1, Reducer2, Reducer3 } from "./Reducer"


export const root = combineReducers({
    item1:Reducer1,
    item2:Reducer2,
    item3:Reducer3
})