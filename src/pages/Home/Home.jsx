// import React, { useState } from 'react'
// import './Home.css'
// import Header from '../../components/Header/Header'
// import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
// import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
// import AppDownload from '../../components/AppDownload/AppDownload'

// const Home = () => {
//     const [category,setCategory] = useState("All");
//   return (
//     <div>
//         <Header/>
//         <ExploreMenu category={category} setCategory = { setCategory}/>
//          <FoodDisplay category={category}/>
//          <AppDownload/>
//     </div>
//   )
// }

// export default Home

// import React, { useState, useEffect } from 'react'
// import './Home.css'
// import Header from '../../components/Header/Header'
// import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
// import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
// import AppDownload from '../../components/AppDownload/AppDownload'

// const Home = () => {
//   const [category, setCategory] = useState("All")
//   const [timeLeft, setTimeLeft] = useState(55)
//   const [showMessage, setShowMessage] = useState(true)

//   useEffect(() => {
//     if (!showMessage) return

//     const timer = setInterval(() => {
//       setTimeLeft(prev => {
//         if (prev === 1) {
//           clearInterval(timer)
//           setShowMessage(false)
//           return 0
//         }
//         return prev - 1
//       })
//     }, 1000)

//     return () => clearInterval(timer)
//   }, [showMessage])

//   return (
//     <div>
//       <Header />

//       {showMessage && (
//         <div className="server-message">
//           <p>Just wait a while, the food is preparing</p>
//           <span>Loading… {timeLeft}s</span>
//         </div>
//       )}

//       <ExploreMenu category={category} setCategory={setCategory} />
//       <FoodDisplay category={category} />
//       <AppDownload />
//     </div>
//   )
// }

// export default Home

// https://food-backend-defr.onrender.com

import React, { useState, useEffect } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'
import axios from 'axios'

const Home = () => {
  const [category, setCategory] = useState("All")
  const [timeLeft, setTimeLeft] = useState(60)
  const [showMessage, setShowMessage] = useState(false)

  // 🔹 Check server status
  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get('https://food-backend-defr.onrender.com/api/health', { timeout: 3000 })
        setShowMessage(false) // server already running
      } catch (err) {
        setShowMessage(true) // server cold start
      }
    }

    checkServer()
  }, [])

  // 🔹 Countdown logic
  useEffect(() => {
    if (!showMessage) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 1) {
          clearInterval(timer)
          setShowMessage(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showMessage])

  return (
    <div>
      <Header />

      {showMessage && (
        <div className="server-message">
          <p>Just wait a while, the server is rendering</p>
          <span>Loading… {timeLeft}s</span>
        </div>
      )}

      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay category={category} />
      <AppDownload />
    </div>
  )
}

export default Home


