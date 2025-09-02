import './App.css'
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';

const socketBaseUrl = typeof window !== 'undefined'
  ? (import.meta?.env?.VITE_SOCKET_URL
      || (window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin))
  : undefined;
const socket = io(socketBaseUrl, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

const App = () => {
  const[joinRoom,setJoinRoom] = useState(false);
  const[roomid,setRoomid] = useState('');
  const[username,setUsername] = useState(''); 
  const[languege,setLanguege] = useState('python');
  const[code,setcode] = useState("")
  const[copySuccess,setCopySuccess] = useState(false)
  const[users,setUsers] = useState([])
  const[typing,settyping] = useState("")
  useEffect(()=>{
    socket.on("userJoined",(users)=>{
      setUsers(users)
    })
    socket.on("codeupdate",(newcode)=>{
      setcode(newcode)
    
    })
    socket.on("userTyping",(user)=>{
      settyping(`${user} is typing...`)
      setTimeout(() => settyping(""),2000)
    })
    socket.on("languageUpdate",(newLanguage)=>{
      setLanguege(newLanguage)
    })
    return ()=>{
      socket.off("userJoined")
      socket.off("codeupdate")
      socket.off("userTyping")
      socket.off("languageUpdate")
    }
  },[])
  useEffect(() =>{
    const handleBeforeUnload = () =>{
      socket.emit("leaveRoom",{roomId:roomid})
    }
    window.addEventListener("beforeunload",handleBeforeUnload)
    return () =>{
      window.removeEventListener("beforeunload",handleBeforeUnload)
    }
  },[roomid])
  const joinroom = () =>{
    if(roomid && username){
      socket.emit("join",{roomId:roomid,userName:username})
      setJoinRoom(true)
    }
  }
  const copyroomId = async () => {
    try {
      await navigator.clipboard.writeText(roomid);
      setCopySuccess(true)
      setTimeout(() => {
        setCopySuccess(false)
      }, 2000);
    } catch (err) {
      console.error('Failed to copy room ID:', err);
    }
  }
  const handlecodechange = (newcode) => {
    setcode(newcode)
    socket.emit("codechange",{roomId:roomid,code:newcode})
    socket.emit("typing",{roomId:roomid,userName:username})
  }
  
  const leaveRoom = () => {
    socket.emit("leaveRoom",{roomId:roomid})
    setJoinRoom(false)
    setUsers([])
    setcode("")
  }  
  if(!joinRoom){
    return <div className="jain-container">
      <div className='join-form'>
        <h1>Join code Space</h1>
        <input type="text" placeholder='Enter Room ID' value={roomid} onChange={(e)=>setRoomid(e.target.value)} ></input>
        <input type="text" placeholder='Enter Your Name' value={username} onChange={(e)=>setUsername(e.target.value)}></input>
        <button onClick={joinroom}>Join</button> 
      </div>
    </div>  
  }
  return <div className='editor-container'>
    <div className="sidebar">
      <div className="room-info">
        <h2>Code Room:{roomid}</h2>
        <button onClick={copyroomId}>Copy Id</button>
        {copySuccess && <p>Done</p>}
      </div>
      <h3>Users in Room</h3>
      <ul>
        {users.map((user,index)=>(
          <li key={index}>{user.slice(0,8)}...</li>
        ))}
      </ul>
      <p className='user-typing'>{typing}</p>
      <select className='languege' value={languege} onChange={(e)=>{
        const newLanguage = e.target.value;
        setLanguege(newLanguage);
        socket.emit("languageChange",{roomId:roomid,language:newLanguage});
      }}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>  
      </select>
      <button className='leave-button' onClick={leaveRoom}>Leave Room</button>
    </div>
    <div className="editor-wrapper">
      <Editor
      height={"100%"}
      defaultLanguage={languege}
      language={languege}
      value={code}
      onChange={handlecodechange}
      theme='vs-dark'
      options={
        {
         minimap:{enabled:false},
         fontSize:14,  
        }
      }
      />
    </div>
  </div>  
}


export default App