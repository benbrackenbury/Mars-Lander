import react, { useState, useEffect } from 'react'

import '../style/index.scss'
import AppContext from '../context'

/* acts as a wrapper for all other pages;
 contains global states and passes to children */

export default ({ Component, pageProps }) => {

  //global states
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [autonomyLevel, setAutonomyLevel] = useState("full")
  const [antialias, setAntialias] = useState(true)
  const [pausing, setPausing] = useState(true)
  const [customName, setCustomName] = useState('Custom Spacecraft')
  const [customMass, setCustomMass] = useState(200)
  const [customLandingMethod, setCustomLandingMethod] = useState('propulsion')

  /* states to pass to all components, 
  its easier to just pass a single object to children
  instead of a huge string of variables */
  const allProps = {
      selectedProfile, setSelectedProfile,
      autonomyLevel, setAutonomyLevel,
      antialias, setAntialias,
      pausing, setPausing,
      customName, setCustomName,
      customMass, setCustomMass,
      customLandingMethod, setCustomLandingMethod,
  }

  //wrapper for all pages
  return (
    <AppContext.Provider value={{ ...allProps }}>
      <Component {...pageProps} />
    </AppContext.Provider>
 )
}