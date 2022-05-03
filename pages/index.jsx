import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'

import AppContext from '../context'

const MenuScreen = () => {

  const [profiles, setProfiles] = useState([])
  const [spacecraftType, setSpacecraftType] = useState("nasa-mer")

  //read global states
  const { 
    selectedProfile, setSelectedProfile,
    autonomyLevel, setAutonomyLevel,
    antialias, setAntialias,
    pausing, setPausing,
  } = useContext(AppContext)

  //fetch all profiles
  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setProfiles(data.profiles))
  }, [])

  //set selectedprofile state
  useEffect(() => {
    let profile = profiles.filter(profile => profile.id === spacecraftType)[0]
    setSelectedProfile(profile)
  }, [spacecraftType, profiles])

  return (
    <div className="Menu">

      <div className="interface">
        <h1 className='title'>Mars Lander</h1>

        <div className="form">
          <form>

            <label htmlFor="sc-type">Spacecraft type</label>
            <select name="sc-type" id="sc-type" value={spacecraftType} onChange={e => setSpacecraftType(e.target.value)}>
              {profiles.map(profile => {
                return <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.mass}kg)
                </option>
              })}
            </select>

            <label htmlFor="autonomy">Autonomy level</label>
            <select name="autonomy" id="autonomy" value={autonomyLevel} onChange={e => setAutonomyLevel(e.target.value)}>
              <option value="full">Full</option>
              <option value="guided">Guided</option>
              <option value="none">None</option>
            </select>

            <div id="antialiasing">
              <input type="checkbox" name="antialias" id="antialias" checked={antialias} onChange={e => setAntialias(e.target.checked)}/>
              <label htmlFor="antialias"> Enable antialiasing (may affect performance)</label>
            </div>

            {autonomyLevel==='guided' && (
              <div id="pausing">
                <input type="checkbox" name="pausing" id="pausing" checked={pausing} onChange={e => setPausing(e.target.checked)}/>
                <label htmlFor="pausing"> Pause for player input</label>
              </div>
            )}

          </form>

          <Link href={'/game'} replace as={'/'}>
            <button className='start-btn'>
              Start
            </button>
          </Link>

        </div>
      </div>

      <div className="graphic">
        <img src="assets/img/mars-shadow.png" alt="Mars" />
      </div>

    </div>
 )
}

export default MenuScreen
