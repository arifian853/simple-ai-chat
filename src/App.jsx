import './App.css'
import { ChatAI } from './ChatAI'

function App() {

  return (
    <>
      <div className='bg-slate-800 text-white p-5 font-bold px-5 m-0'>Google Gemini API Key Test</div>

      <div className='p-5 bg-slate-900 text-white min-h-screen'>

        <p>Model : Gemini 1.5 Pro</p>

        <ChatAI />
      </div>
      <div className='bg-slate-800 text-white p-5 px-5 m-0'> Copyright © <a className='underline' href="https://arifian853.vercel.app" target='_blank'>Arifian Saputra</a>, {new Date().getFullYear()}. All rights reserved | <a className='underline' href="https://github.com/arifian853/simple-ai-chat" target='_blank'>Repository</a></div>
    </>
  )
}

export default App
