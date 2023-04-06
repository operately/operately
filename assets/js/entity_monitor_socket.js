import {Socket} from "phoenix"

let socket = new Socket("/socket", {params: {token: window.userToken}})
socket.connect()

export default socket
