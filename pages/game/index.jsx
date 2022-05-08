import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import AppContext from '../../context'
import mars, { MARS_RADIUS, GRAVITY } from '../../three/objects/mars'
import exhaust from '../../three/objects/exhaust'

const toRadians = degrees => degrees * (Math.PI / 180)

const Game = () => {
    const router = useRouter()

    //read global states
    const { 
        selectedProfile: profile,
        autonomyLevel, setAutonomyLevel,
        antialias,
        pausing, setPausing,
    } = useContext(AppContext)

    const [sequence, setSequence] = useState([])
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [altitude, setAltitude] = useState(0)
    const [velocity, setVelocity] = useState(0)
    const [acceleration, setAcceleration] = useState(0)
    const [nextPhaseUI, setNextPhaseUI] = useState(null)

    let phaseIndex = 0

    const setup = async () => {
        //set up camera and scene
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000000)

        //set up renderer
        const renderer = new THREE.WebGLRenderer({ antialias })
        renderer.setSize(window.innerWidth, window.innerHeight)
        document.querySelectorAll('canvas').forEach(canvas => canvas.remove())
        document.querySelector('.Game').appendChild(renderer.domElement)

        //set up mars
        scene.add(mars)
        const STARTING_ALTITUDE = 131000
        mars.position.set(0, 0, -(MARS_RADIUS + STARTING_ALTITUDE))

        //atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(3389500+150000, 100, 100)
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xac5440,
            opacity: 0.1,
            transparent: true
        })
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
        mars.add(atmosphere)

        //spacecraft
        let spacecraft = new THREE.Group()
        scene.add(spacecraft)
        let loader = new GLTFLoader()
        let aeroshell = await (await loader.loadAsync('/assets/models/aeroshell.gltf')).scene.children[0]
        spacecraft.add(aeroshell)
        aeroshell.material = new THREE.MeshPhongMaterial({
            color: 0xffffff
        })
        //heatshield
        let heatshield = await (await loader.loadAsync('/assets/models/heatshield.gltf')).scene.children[0]
        spacecraft.add(heatshield)
        heatshield.material = new THREE.MeshPhongMaterial({
            color: 0x888888
        })
        //parachute
        let parachute = await (await loader.loadAsync('/assets/models/parachute.gltf')).scene.children[0]
        spacecraft.add(parachute)
        parachute.material = new THREE.MeshPhongMaterial({
            color: 0xffffff
        })
        //airbag
        let airbag = await (await loader.loadAsync('/assets/models/airbag.gltf')).scene.children[0]
        spacecraft.add(airbag)
        airbag.material = new THREE.MeshPhongMaterial({
            color: 0xffffff
        })
        //spacecraft itself
        if (profile.model) {
            let model = await (await loader.loadAsync(`/assets/models/${profile.model}.glb`)).scene.children[0]
            spacecraft.add(model)
            model.material = new THREE.MeshPhongMaterial({
                color: 0xffffff
            })
            model.scale.set(0.35, 0.35, 0.35)
            model.position.x = 0.5
            model.position.z = 0.5
            model.position.y = -0.4
        }
        //exhaust
        spacecraft.add(exhaust)
        exhaust.scale.set(0, 0, 0)
        //scale
        spacecraft.scale.set(2, 2, 2)

        //directional light for spacecraft
        let light = new THREE.DirectionalLight(0xffffff)
        light.position.set(1, 1, 10).normalize()
        scene.add(light)

        // ambient light
        const ambientlight = new THREE.AmbientLight(0xffffff, 0.1)
        scene.add(ambientlight)

        //set camera positiom
        camera.position.set(0, 0, 20)
        
        //orbit controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.target.set(spacecraft.position.x, spacecraft.position.y, spacecraft.position.z)
        controls.update()

        //create clock object
        const clock = new THREE.Clock()

        //starting values
        let velocityProxy = 5588
        let accelerationProxy = GRAVITY
        let angleOfAttack = 68
        let throttle = 0
        let fuelRemaining = 100
        let mass = profile.mass
        let isPaused = false
        let lastRecordedElapsedTime = 0
        let parachuteDeployIndex
        let animationFrameID

        //keep track of key presses
        let keysDown = {}
        document.addEventListener('keydown', e => {
            keysDown[e.key] = true
        })
        document.addEventListener('keyup', e => {
            keysDown[e.key] = false
        })
        
        const animate = () => {
            let deltaTime = clock.getDelta()

            //move mars towards spacecraft if not paused
            if (!isPaused) {
                clock.running = true
                //increase or decrease velocity
                velocityProxy += accelerationProxy
                //angle of attack and velocity
                if (sequence[phaseIndex].key === 'pre-entry' ||
                    sequence[phaseIndex].key === 'entry' ||
                    sequence[phaseIndex].key === 'aeroshell-jettison' ||
                    sequence[phaseIndex].key === 'descent-pre-parachute' ||
                    sequence[phaseIndex].key === 'parachute-deploy'
                ) {
                    mars.position.z += Math.sin(toRadians(angleOfAttack)) * velocityProxy * deltaTime
                    mars.rotation.y -= 0.000001 * Math.cos(toRadians(angleOfAttack)) * velocityProxy * deltaTime
                    spacecraft.rotation.x = toRadians(90)
                    spacecraft.rotation.y = toRadians(0)
                    spacecraft.rotation.z = toRadians(angleOfAttack)
                } else {
                    mars.position.z += velocityProxy * deltaTime
                    spacecraft.rotation.x = toRadians(90)
                    spacecraft.rotation.y = toRadians(0)
                    spacecraft.rotation.z = toRadians(0)
                }
                //make sure UI is fully visible if unpaused
                document.querySelector('.telemetry').classList.remove('paused')
                document.querySelector('.sc-info').classList.remove('paused')
            } else {
                //stop clock and grey out telemetry if paused
                clock.running = false
                //fade out UI if paused
                document.querySelector('.telemetry').classList.add('paused')
                document.querySelector('.sc-info').classList.add('paused')
            }

            //check for chute deploy and jesttison heat shield
            //check index of parachute deploy phase
            if (sequence[phaseIndex].key === 'chuteDeploy') {
                parachuteDeployIndex = phaseIndex
            }
            //if parachute has been deployed
            if (phaseIndex >= parachuteDeployIndex + 1) {
                heatshield.visible = false
            }

            //parachute visibility
            parachute.visible = 
                sequence[phaseIndex].key === 'descent-parachute' || sequence[phaseIndex].key === 'backshell-separation'

            //airbag visibility
            airbag.visible = 
                sequence[phaseIndex].key === 'final-decent'

            //aeroshell visibility
            aeroshell.visible = 
                sequence[phaseIndex].key !== 'landing' ||
                (sequence[phaseIndex].key !== 'touchdown' && profile.name==="NASA MSL")

            //spacecraft color
            aeroshell.material.color = new THREE.Color(sequence[phaseIndex].key === 'entry' ? 0xffaaaa : 0xffffff)
            heatshield.material.color = new THREE.Color(sequence[phaseIndex].key === 'entry' ? 0x751f00 : 0xaaaaaa)

            //calculate altitude
            let altitudeProxy = spacecraft.position.z - (mars.position.z + MARS_RADIUS)

            //drag & acceleration
            let density, dragNewtons, dragAcc
            switch (sequence[phaseIndex].key) {
                case 'entry':
                case 'descent-pre-parachute':
                case 'parachute-deploy':
                    density = 0.02 * Math.exp(-altitudeProxy/11100)
                    dragNewtons = 0.5 * density * Math.pow(velocityProxy, 2) * profile.crossSectionArea
                    dragAcc = dragNewtons / mass
                    accelerationProxy = GRAVITY - dragAcc
                    break
                case 'descent-pre-parachute':
                    density = 0.02 * Math.exp(-altitudeProxy/11100)
                    dragNewtons = 0.5 * density * Math.pow(velocityProxy, 2) * profile.crossSectionArea
                    dragAcc = dragNewtons / (mass * 2)
                    accelerationProxy = GRAVITY - dragAcc
                    break
                case 'descent-parachute':
                    accelerationProxy = profile.parachuteDeceleration
                    break
                case 'landing':
                    if (throttle === 0.5) {
                        accelerationProxy = 0
                    } else {
                        accelerationProxy = GRAVITY - (throttle * 1.5 * GRAVITY)
                    }
                    break
                default:
                    accelerationProxy = GRAVITY
            }

            //next phase stuff
            let nextPhase = sequence[phaseIndex + 1]
            let progress = 0
            if (nextPhase !== undefined) {
                let nextPhaseTrigger = nextPhase.trigger[autonomyLevel] ?? nextPhase.trigger.full
                if (nextPhaseTrigger.type === 'altitude' && altitudeProxy < nextPhaseTrigger.value) {
                    phaseIndex++
                } else if (nextPhaseTrigger.type === 'velocity' && velocityProxy < nextPhaseTrigger.value) {
                    phaseIndex++
                } else if (nextPhaseTrigger.type === 'key') {
                    let elapsed = clock.elapsedTime
                    if (elapsed !== 0 && pausing) lastRecordedElapsedTime += elapsed
                    isPaused = pausing ? true : false
                    if (keysDown[nextPhaseTrigger.value]) {
                        phaseIndex++
                        isPaused = false
                    }
                }

                //calc progress to next trigger
                if (nextPhaseTrigger.type === 'altitude') {
                    progress = nextPhaseTrigger.value / altitudeProxy
                } else if (nextPhaseTrigger.type === 'velocity') {
                    progress =  nextPhaseTrigger.value / velocityProxy
                } else if (nextPhaseTrigger.type === 'key') {
                    progress = keysDown[nextPhaseTrigger.value] ? 1 : 0
                }

                setNextPhaseUI(nextPhase)
            }

            //landing: handle throttle and exahust graphics
            if (sequence[phaseIndex].key === 'landing') {
                //show telemetry and handle throttle
                document.querySelector('.landing-telemetry').classList.remove('hidden')
                if (fuelRemaining > 0) {
                    if (keysDown['Shift']) {
                        if (throttle < 1) {
                            throttle += 0.01
                        }
                    }
                    if (keysDown['Control']) {
                        if (throttle > 0) {
                            throttle -= 0.01
                        }
                    }
                    if (keysDown['e']) {
                        throttle = 0.5
                        keysDown['e'] = false
                    }
                } else {
                    throttle = 0
                }

                fuelRemaining -= throttle * deltaTime * (throttle > 0.5 ? 1.5 : 1)
                mass = 900 - 100 + fuelRemaining

                exhaust.scale.set(1, -throttle, 1)
                document.querySelector('#throttle-label').innerHTML = `Throttle: ${Math.floor(throttle * 100)}%`
                document.querySelector('#fuel-label').innerHTML = `Fuel Remaining: ${Math.floor(fuelRemaining)}%`

                document.querySelector('.throttle-bar').style.width = `${throttle * 100}%`
                document.querySelector('.fuel-bar').style.width = `${Math.floor(fuelRemaining)}%`
                document.querySelector('.fuel-bar').style.backgroundColor = `${fuelRemaining > 50 ? 'green' : (fuelRemaining > 20 ? 'orange' : 'red')}`
                document.querySelector('.altitude-bar').style.height = `${100 - Math.floor(100*(altitudeProxy / sequence[phaseIndex].trigger.full.value))}%`

            }

            //update UI
            setAltitude(altitudeProxy)
            setVelocity(velocityProxy)
            setAcceleration(accelerationProxy)
            setTimeElapsed(clock.elapsedTime + lastRecordedElapsedTime)
            document.querySelector('.phase').innerHTML = sequence[phaseIndex].name
            if (autonomyLevel !== 'none') {
                document.querySelector('.guidence > .text').innerHTML = sequence[phaseIndex].description[autonomyLevel]
                document.querySelector('.progress-bar').style.transform = `scaleX(${progress})`
            }

            //handle landing or crash
            if (altitudeProxy <= 0 ) {
                let success = true
                if (velocityProxy > 10) {
                    success = false
                    //set text at bottom to reflect end state
                    if (autonomyLevel !== 'none') {
                        document.querySelector('.guidence > .text').innerHTML 
                            = `Unfortunatley the spacecraft has crashed at a velocity of ${Math.floor(velocityProxy)} m/s.`
                    }
                }
                isPaused = true
                setTimeout(() => {
                    //navigate to end screen
                    window.location = `/game/end?success=${success}&velocity=${Math.floor(velocityProxy)}`
                    //make sure there is no way for animation to stay running
                    cancelAnimationFrame(animationFrameID)
                    const nullfunc = () => {}
                    requestAnimationFrame(nullfunc)
                    document.querySelectorAll('canvas').forEach(canvas => canvas.remove())
                    renderer = null
                }, 3000)
            }
            
            //animation loop
            animationFrameID = requestAnimationFrame(animate)
            renderer.render(scene, camera)
        }

        //initial call of animation loop
        animate()

        //make canvas scale as window resizes
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    }

    useEffect(() => {
        //go back to menu if no profile loaded
        if (!profile) router.replace('/')

        //get sequence from profile
        setSequence(Object.keys(profile.sequence).map(phase => {
            return profile.sequence[phase]
        }))

        // translate old autonomy system to new difficulty system
        if (autonomyLevel === 'full') {
            setAutonomyLevel('guided')
            setPausing(true)
        } else if (autonomyLevel === 'guided') {
            setPausing(false)
        }
    }, [])

    //start setup process if a sequence has been loaded
    useEffect(() => {
        if (sequence.length > 0) setup()
    }, [sequence])

    //User interface JSX
    return profile && (
        <div className="Game">

            {/* Telemetry display on the left side of the screen */}
            <div className="telemetry">
                { sequence[phaseIndex]?.name 
                    ? <p className="phase">{sequence[phaseIndex].name}</p>
                    : <p>Loading...</p>
                }

                <p>T+ {Math.floor(timeElapsed)}s</p>
                <p>Altitude: {Math.floor(altitude)} m</p>
                <p>Velocity: {Math.ceil(velocity)} m/s</p>
                <p>Net Acceleration: {acceleration.toFixed(2)} m/s^2</p>

                {/* Telemetry related to landing */}
                <div className="landing-telemetry hidden">
                    <br />
                    <p id="throttle-label">Throttle: 0%</p>
                    <div className="throttle-guage">
                        <div className="throttle-bar"></div>
                    </div>

                    <p id="fuel-label">Fuel: 100%</p>
                    <div className="fuel-guage">
                        <div className="fuel-bar"></div>
                    </div>

                    <br />

                    <div className="altitude-guage">
                        <div className="altitude-bar"></div>
                    </div>
                </div>

            </div>

            {/* Spacecraft info for right side of screen */}
            <div className="sc-info">
                <p className="description">
                    {profile.isCustom ? profile.name : profile.description}
                </p>
                {/* details of next phase and when it will occur */}
                {nextPhaseUI && (
                    <div className="upnext">
                        {autonomyLevel!=='none' && (
                            <>
                                <p>Up Next</p>
                                <p>{nextPhaseUI.name}</p>
                            </>
                        )}
                        {nextPhaseUI.trigger.guided && autonomyLevel!=='none' ? (
                            <p>Awaiting input</p>
                        ) : (
                            <p>when {nextPhaseUI.trigger.full.type} = {nextPhaseUI.trigger.full.value}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Guidance and descriptions at the bottom of the screen */}
            {autonomyLevel !== 'none' && sequence[phaseIndex] && (
                <div className="guidence">
                    <div className="progress-bar"></div>
                    <div className="text">
                        {sequence[phaseIndex].description && sequence[phaseIndex].description[autonomyLevel]}
                    </div>
                </div>
            )}

            {/* Canvas will be rendered here */}
        </div>
   )
}

export default Game