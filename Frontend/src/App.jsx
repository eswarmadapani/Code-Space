import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';

const socket = io('http://localhost:5000');

const App = () => {
  const[joinRoom,setJoinRoom] = useState(false);
  const[roomid,setRoomid] = useState('');
  const[username,setUsername] = useState(''); 
  const[language,setLanguage] = useState('python');
  const[code,setcode] = useState("")
  const[copySuccess,setCopySuccess] = useState(false)
  const[users,setUsers] = useState([])
  const[typing,settyping] = useState("")
  const[sidebarOpen,setSidebarOpen] = useState(false)
  
  const generateRoomId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setRoomid(result);
  }
  useEffect(()=>{
    socket.on("userJoined",(users)=>{
      console.log("Users received:", users);
      setUsers(users)
    })
    socket.on("codeupdate",(newcode)=>{
      console.log("Code update received:", newcode);
      if (newcode !== code) {
        setcode(newcode)
      }
     })
    socket.on("userTyping",(user)=>{
      console.log("User typing:", user);
      settyping(`${user} is typing...`)
      setTimeout(() => settyping(""),2000)
    })
    socket.on("languageUpdate",(newLanguage)=>{
      console.log("Language update:", newLanguage);
      setLanguage(newLanguage)
    })
    
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });
    
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
    
    return ()=>{
      socket.off("userJoined")
      socket.off("codeupdate")
      socket.off("userTyping")
      socket.off("languageUpdate")
      socket.off("connect")
      socket.off("disconnect")
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
      console.log("Joining room:", roomid, "with username:", username);
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">CodeSpace</h1>
            <p className="text-white/70 text-sm">Collaborate in real-time</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter Room ID" 
                value={roomid} 
                onChange={(e)=>setRoomid(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              />
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter Your Name" 
                value={username} 
                onChange={(e)=>setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              />
            </div>
            
            <button 
              onClick={joinroom}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!roomid || !username}
            >
              Join CodeSpace
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/50 text-xs mb-3">
              Enter a room ID to join an existing session
            </p>
            <button 
              onClick={generateRoomId}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium underline transition-colors duration-200 hover:no-underline"
            >
              or create a new room
            </button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="h-screen bg-gray-900 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="text-white font-semibold">CodeSpace</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-white hover:bg-gray-900 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`w-80 lg:w-80 md:w-72 bg-gray-800 border-r border-gray-700 flex flex-col shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative absolute inset-y-0 left-0 z-50 md:flex`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Room</h2>
                <p className="text-gray-400 text-sm font-mono">{roomid}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={copyroomId}
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium rounded-md transition-colors duration-200 border border-blue-500/20"
              >
                {copySuccess ? '✓ Copied' : 'Copy ID'}
              </button>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Active Users ({users.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {users.map((user, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-900/50">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {user.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-sm font-medium truncate">
                  {user.length > 12 ? `${user.slice(0, 12)}...` : user}
                </span>
              </div>
            ))}
          </div>
          
          {typing && (
            <div className="mt-3 p-3 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-400/40 rounded-xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                </div>
                <p className="text-emerald-300 text-sm font-medium flex items-center">
                  <span className="mr-1">💬</span>
                  {typing}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="p-6 border-b border-gray-700">
          <label className="block text-white font-semibold text-sm uppercase tracking-wider mb-3">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => {
              const newLanguage = e.target.value;
              setLanguage(newLanguage);
              socket.emit("languageChange", {roomId: roomid, language: newLanguage});
            }}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        {/* Leave Button */}
        <div className="mt-auto p-6">
          <button 
            onClick={leaveRoom}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Editor Header */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-gray-400 text-sm font-mono">
              {language === 'javascript' ? 'main.js' :
               language === 'python' ? 'main.py' :
               language === 'java' ? 'Main.java' : 'main.cpp'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-gray-400 text-xs">
              {users.length} {users.length === 1 ? 'collaborator' : 'collaborators'}
            </div>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 relative">
          {/* Floating Typing Indicator */}
          {typing && (
            <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-emerald-600/95 to-blue-600/95 backdrop-blur-md border border-emerald-400/50 rounded-xl px-4 py-3 shadow-2xl animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                  <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                </div>
                <span className="text-white text-sm font-semibold flex items-center">
                  <span className="mr-2">⌨️</span>
                  {typing}
                </span>
              </div>
            </div>
          )}
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={handlecodechange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
              lineHeight: 1.5,
              scrollBeyondLastLine: false,
              smoothScrolling: false,
              disableMonospaceOptimizations: true,
              cursorBlinking: 'solid',
              cursorSmoothCaretAnimation: 'off',
              cursorStyle: 'line',
              cursorWidth: 2,
              renderLineHighlight: 'gutter',
              automaticLayout: true,
              wordWrap: 'off',
              mouseWheelZoom: false,
              contextmenu: true,
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false
              },
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              tabCompletion: 'on',
              parameterHints: { enabled: true },
              hover: { enabled: true },
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'mouseover',
              matchBrackets: 'always',
              autoClosingBrackets: 'languageDefined',
              autoClosingQuotes: 'languageDefined',
              autoSurround: 'languageDefined',
              autoIndent: 'full',
              formatOnPaste: false,
              formatOnType: false,
              insertSpaces: true,
              tabSize: language === 'python' ? 4 : 2,
              detectIndentation: true,
              trimAutoWhitespace: true,
              renderIndentGuides: true,
              highlightActiveIndentGuide: true,
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                bracketPairsHorizontal: true,
                highlightActiveBracketPair: true,
                indentation: true,
                highlightActiveIndentation: true
              },
              suggest: {
                insertMode: 'insert',
                filterGraceful: true,
                localityBonus: true,
                shareSuggestSelections: false,
                snippetsPreventQuickSuggestions: false,
                showIcons: true,
                showStatusBar: true
              },
              inlineSuggest: { enabled: false },
              semanticHighlighting: { enabled: true },
              occurrencesHighlight: true,
              selectionHighlight: true,
              codeLens: false,
              colorDecorators: true,
              lightbulb: { enabled: false },
              links: true,
              glyphMargin: true,
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              overviewRulerLanes: 2,
              hideCursorInOverviewRuler: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14
              },
              find: {
                addExtraSpaceOnTop: false,
                autoFindInSelection: 'never',
                seedSearchStringFromSelection: 'always'
              },
              gotoLocation: {
                multipleReferences: 'peek',
                multipleDefinitions: 'peek',
                multipleDeclarations: 'peek',
                multipleImplementations: 'peek',
                multipleTypeDefinitions: 'peek'
              }
            }}
          />
        </div>
      </div>
    </div>
  )  
}


export default App