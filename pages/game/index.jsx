import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import AppContext from '../../context'
import mars, { MARS_RADIUS, GRAVITY } from '../../three/objects/mars'
import exhaust from '../../three/objects/exhaust'
import { initialVelocity } from '../../three/objects/spacecraft'

const toRadians = degrees => degrees * (Math.PI / 180)

const Game = () => {
    const router = useRouter()

    //read global states
    const { 
        selectedProfile: profile,
        autonomyLevel, setAutonomyLevel,
        antialias,
        pausing, setPausing
    } = useContext(AppContext)

    const [sequence, setSequence] = useState([])
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [altitude, setAltitude] = useState(0)
    const [acceleration, setAcceleration] = useState(0)
    const [velocity, setVelocity] = useState(0)
    const [nextPhaseUI, setNextPhaseUI] = useState(null)

    let phaseIndex = 0

    const setup = async () => {
        const mainScene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000000)

        const renderer = new THREE.WebGLRenderer({ antialias })
        renderer.setSize(window.innerWidth, window.innerHeight)
        document.querySelectorAll('canvas').forEach(canvas => canvas.remove())
        document.querySelector('.Game').appendChild(renderer.domElement)

        mainScene.add(mars)
        const STARTING_ALTITUDE = 131000
        mars.position.set(0, 0, -(MARS_RADIUS + STARTING_ALTITUDE))
        camera.position.set(0, 0, 20)

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
        let loader = new GLTFLoader()
        let spacecraft = await (await loader.loadAsync('/assets/models/msl-aeroshell.gltf')).scene.children[0]
        mainScene.add(spacecraft)
        spacecraft.material = new THREE.MeshPhongMaterial({
            color: 0xffffff
        })

        //directional light for spacecraft
        let light = new THREE.DirectionalLight(0xffffff)
        light.position.set(1, 1, 10).normalize()
        mainScene.add(light)

        // ambient light
        const ambientlight = new THREE.AmbientLight(0xffffff, 0.1)
        mainScene.add(ambientlight)

        //stars
        const starGeometry = new THREE.BufferGeometry()
        const starPositions = []
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 5000
            const y = (Math.random() - 0.5) * 5000
            const z = Math.random() * 5000
            starPositions.push(x, y, z)
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
        })
        const stars = new THREE.Points(starGeometry, starMaterial)
        // scene.add(stars)

        spacecraft.add(exhaust)
        exhaust.scale.set(0, 0, 0)
        
        //orbit controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.target.set(spacecraft.position.x, spacecraft.position.y, spacecraft.position.z)
        controls.update()

        const clock = new THREE.Clock()

        let vel = initialVelocity
        let acc = GRAVITY
        let angleOfAttack = 68
        let throttle = 0
        let fuelRemaining = 100
        let mass = profile.mass
        let isPaused = false
        let lastRecordedElapsedTime = 0

        spacecraft.scale.set(2, 2, 2)

        let keysDown = {}
        document.addEventListener('keydown', e => {
            keysDown[e.key] = true
        })
        document.addEventListener('keyup', e => {
            keysDown[e.key] = false
        })

        let scene = mainScene
        let hasSwitchedToLandingScene = false
        
        let animationFrameID
        const animate = () => {
            let deltaTime = clock.getDelta()
            if (!isPaused) {
                clock.running = true
                //increase or decrease velocity
                vel += acc
                //angle of attack and velocity
                if (sequence[phaseIndex].key === 'pre-entry' ||
                    sequence[phaseIndex].key === 'entry' ||
                    sequence[phaseIndex].key === 'aeroshell-jettison' ||
                    sequence[phaseIndex].key === 'descent-pre-parachute' ||
                    sequence[phaseIndex].key === 'parachute-deploy'
                ) {
                    mars.position.z += Math.sin(toRadians(angleOfAttack)) * vel * deltaTime
                    mars.rotation.y -= 0.000001 * Math.cos(toRadians(angleOfAttack)) * vel * deltaTime
                    spacecraft.rotation.x = toRadians(90)
                    spacecraft.rotation.y = toRadians(0)
                    spacecraft.rotation.z = toRadians(angleOfAttack)
                } else {
                    mars.position.z += vel * deltaTime
                    spacecraft.rotation.x = toRadians(90)
                    spacecraft.rotation.y = toRadians(0)
                    spacecraft.rotation.z = toRadians(0)
                }
                //make sure UI is fully visible if unpaused
                document.querySelector('.telemetry').classList.remove('paused')
                document.querySelector('.sc-info').classList.remove('paused')
            } else {

                clock.running = false
                //fade out UI if paused
                document.querySelector('.telemetry').classList.add('paused')
                document.querySelector('.sc-info').classList.add('paused')
            }

            //altitude
            let alt = spacecraft.position.z - (mars.position.z + MARS_RADIUS)

            //drag & acceleration
            let density, dragNewtons, dragAcc
            switch (sequence[phaseIndex].key) {
                case 'entry':
                case 'descent-pre-parachute':
                case 'parachute-deploy':
                    density = 0.02 * Math.exp(-alt/11100)
                    dragNewtons = 0.5 * density * Math.pow(vel, 2) * profile.crossSectionArea
                    dragAcc = dragNewtons / mass
                    acc = GRAVITY - dragAcc
                    spacecraft.material.color = new THREE.Color(0xffaaaa)
                    break
                case 'descent-pre-parachute':
                    density = 0.02 * Math.exp(-alt/11100)
                    dragNewtons = 0.5 * density * Math.pow(vel, 2) * profile.crossSectionArea
                    dragAcc = dragNewtons / (mass * 2)
                    acc = GRAVITY - dragAcc
                    spacecraft.material.color = new THREE.Color(0xffffff)
                    break
                case 'descent-parachute':
                    acc = profile.parachuteDeceleration
                    spacecraft.material.color = new THREE.Color(0xffffff)
                    break
                case 'landing':
                    acc = GRAVITY - (throttle * 1.5 * GRAVITY)
                    spacecraft.material.color = new THREE.Color(0xffffff)
                    break
                default:
                    acc = GRAVITY
                    spacecraft.material.color = new THREE.Color(0xffffff)
            }

            //next phase stuff
            let nextPhase = sequence[phaseIndex + 1]
            let progress = 0
            if (nextPhase !== undefined) {
                let nextPhaseTrigger = nextPhase.trigger[autonomyLevel] ?? nextPhase.trigger.full
                if (nextPhaseTrigger.type === 'altitude' && alt < nextPhaseTrigger.value) {
                    phaseIndex++
                } else if (nextPhaseTrigger.type === 'velocity' && vel < nextPhaseTrigger.value) {
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
                    progress = nextPhaseTrigger.value / alt
                } else if (nextPhaseTrigger.type === 'velocity') {
                    progress =  nextPhaseTrigger.value / vel
                } else if (nextPhaseTrigger.type === 'key') {
                    progress = keysDown[nextPhaseTrigger.value] ? 1 : 0
                }

                setNextPhaseUI(nextPhase)
            }

            //landing
            if (sequence[phaseIndex].key === 'landing') {

                //landing grahics changes
                

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
            }

            //update UI
            setAltitude(alt)
            setVelocity(vel)
            setAcceleration(acc)
            setTimeElapsed(clock.elapsedTime + lastRecordedElapsedTime)
            document.querySelector('.phase').innerHTML = sequence[phaseIndex].name
            if (autonomyLevel !== 'none') {
                document.querySelector('.guidence > .text').innerHTML = sequence[phaseIndex].description[autonomyLevel]
                document.querySelector('.progress-bar').style.transform = `scaleX(${progress})`
            }

            if (alt < 1) {
                isPaused = true
            }
            
            //animation loop
            animationFrameID = requestAnimationFrame(animate)
            renderer.render(scene, camera)
        }

        animate()

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

    useEffect(() => {
        if (sequence.length > 0) setup()
    }, [sequence])

    return profile && (
        <div className="Game">
            <div className="telemetry">
                { sequence[phaseIndex]?.name 
                    ? <p className="phase">{sequence[phaseIndex].name}</p>
                    : <p>Loading...</p>
                }

                <p>T+ {Math.floor(timeElapsed)}s</p>
                <p>Altitude: {Math.floor(altitude)} m</p>
                <p>Velocity: {Math.ceil(velocity)} m/s</p>
                <p>Net Acceleration: {acceleration.toFixed(2)} m/s^2</p>

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
                </div>

            </div>

            <div className="sc-info">
                <p className="description">{profile.description}</p>
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