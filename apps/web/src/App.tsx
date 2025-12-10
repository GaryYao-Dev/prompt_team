import {BrowserRouter} from 'react-router-dom'
  import './App.css'
  import Pages from '@/routes/index'

  function App() {
    return (
        <BrowserRouter>
          <Pages/>
        </BrowserRouter>
    )
  }

  export default App