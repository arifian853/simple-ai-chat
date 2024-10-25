import './App.css'
import { ChatAI } from './ChatAI'

function App() {

  return (
    <>
      <div className='p-5 bg-[#2A2D34] text-white min-h-screen'>
        <div className='bg-slate-700 text-white p-5 px-5 m-0 text-center rounded-md'><p>Google Generative Language API (Gemini API) - Chat with AI</p> </div>
        <div>
          <ChatAI />
        </div>
      </div>

    </>
  )
}

export default App
