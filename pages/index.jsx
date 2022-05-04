import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'

import AppContext from '../context'

/* Page for menu screen */

const MenuScreen = () => {

  const [profiles, setProfiles] = useState([])
  const [spacecraftType, setSpacecraftType] = useState("nasa-msl")

  //read global states
  const { 
    selectedProfile, setSelectedProfile,
    autonomyLevel, setAutonomyLevel,
    antialias, setAntialias,
    customName, setCustomName,
    customMass, setCustomMass,
    customLandingMethod, setCustomLandingMethod,
  } = useContext(AppContext)

  //fetch all profiles
  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setProfiles(data.profiles))
  }, [])

  //set selectedprofile state
  useEffect(() => {
    let profile
    if (spacecraftType !== "custom") {
      profile = profiles.filter(profile => profile.id === spacecraftType)[0]
    } else {
      //if custom, create new profile based on an existing one
      let baseProfile 
        = profiles.filter(profile => profile.name === (customLandingMethod==='propulsion' ? 'NASA MSL' : 'NASA MER'))[0]
      profile = {...baseProfile}
      profile.name = customName
      profile.mass = customMass
      profile.isCustom = true
    }
    setSelectedProfile(profile)
  }, [spacecraftType, profiles, customLandingMethod, customMass, customName])

  const spacecraftTypeChanged = e => {
    setSpacecraftType(e.target.value)
  }

  // user interface JSX
  return (
    <div className="Menu">

      <div className="interface">
        <h1 className='title'>Mars Lander</h1>

        <div className="form">
          <form>

            {/* spacecraft type selection */}
            <label htmlFor="sc-type">Spacecraft type</label>
            <select name="sc-type" id="sc-type" value={spacecraftType} onChange={e => spacecraftTypeChanged(e)}>
              {profiles.map(profile => {
                return <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.mass}kg)
                </option>
              })}
              <option value="" disabled>----------------</option> {/* separator */}
              <option value="custom">Custom</option>
            </select>

            {/* custom type properties */}
            {spacecraftType === 'custom' && (
              <fieldset id="custom-properties">
                <legend>Custom spacecraft</legend>
                <label htmlFor="name">Name</label>
                <input type="text" name="name" id="name" placeholder="Name" value={customName} onChange={e => setCustomName(e.target.value)} />
                <br />
                <label htmlFor="mass">Mass</label>
                <input type="number" name="mass" id="mass" placeholder="kg" value={customMass} onChange={e => setCustomMass(e.target.value)} />
                <br />
                <label htmlFor="landingmethod">Landing method</label>
                <br />
                <select name="landingmethod" id="landingmethod" value={customLandingMethod} onChange={e => setCustomLandingMethod(e.target.value)}>
                  <option value="propulsion">Propulsion</option>
                  <option value="airbag">Airbag</option>
                </select>
              </fieldset>
            )}

            {/* difficulty selection */}
            <label htmlFor="autonomy">Difficulty</label>
            <select name="autonomy" id="autonomy" value={autonomyLevel} onChange={e => setAutonomyLevel(e.target.value)}>
              <option value="full">Easy</option>
              <option value="guided">Medium</option>
              <option value="none">Hard</option>
            </select>

              {/* option to toggle anti-alising */}
            <div id="antialiasing">
              <input type="checkbox" name="antialias" id="antialias" checked={antialias} onChange={e => setAntialias(e.target.checked)}/>
              <label htmlFor="antialias"> Enable antialiasing (may affect performance)</label>
            </div>

          </form>

          {/* start button */}
          <Link href={'/game'} replace as={'/'}>
            <button className='start-btn'>
              Start
            </button>
          </Link>

        </div>
      </div>

      {/* Mars graphic for right side of screen */}
      <div className="graphic">
        <img src="assets/img/mars-shadow.png" alt="Mars" />
      </div>

    </div>
 )
}

export default MenuScreen
