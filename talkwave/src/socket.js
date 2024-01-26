import { BASE_URL } from './uri';
const io = require("socket.io-client")
const socket = io(`${BASE_URL}`);

export default socket;
