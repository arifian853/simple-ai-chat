import './App.css'
import { Chat } from './Chat'
import { ThemeProvider } from './components/theme-provider'

function App() {

  return (

    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Chat />
      </ThemeProvider>
    </>

  )
}

export default App
