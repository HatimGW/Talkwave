import { applyMiddleware,legacy_createStore } from "redux";
import {thunk} from "redux-thunk";
import { root } from "./Combine";

export const store = legacy_createStore(root,applyMiddleware(thunk))