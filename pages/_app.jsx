import react, { useState, useEffect } from 'react'

import '../style/index.scss'
import AppContext from '../context'

export default ({ Component, pageProps }) => {

  //global states
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [autonomyLevel, setAutonomyLevel] = useState("full")
  const [antialias, setAntialias] = useState(true)
  const [pausing, setPausing] = useState(true)

  //states to pass to all components
  const allProps = {
      selectedProfile, setSelectedProfile,
      autonomyLevel, setAutonomyLevel,
      antialias, setAntialias,
      pausing, setPausing,
  }

  return (
    <AppContext.Provider value={{ ...allProps }}>
      <Component {...pageProps} />
    </AppContext.Provider>
 )
}