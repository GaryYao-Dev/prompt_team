import HomePage from '@/pages/home-page/home-page'
  import {FC} from 'react'
  import {Routes, Route} from 'react-router-dom'

  const Pages: FC = () => {
    return (
      <Routes>
        <Route path="/" element={< HomePage/>}/>
      </Routes>
    )
  }

  export default Pages
  