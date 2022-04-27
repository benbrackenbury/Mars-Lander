import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import AppContext from '../../context'
import mars, { MARS_RADIUS, GRAVITY } from '../../three/objects/mars'
import { initialVelocity } from '../../three/objects/spacecraft'

const toRadians = angle => angle * (Math.PI / 180)

const Game = () => {
    const router = useRouter()

    //read global states
    const { 
        selectedProfile: profile,
        autonomyLevel,
        antialias
    } = useContext(AppContext)

    const [sequence, setSequence] = useState([])
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [altitude, setAltitude] = useState(0)
    const [acceleration, setAcceleration] = useState(0)
    const [velocity, setVelocity] = useState(0)
    const [nextPhaseUI, setNextPhaseUI] = useState(null)

    let phaseIndex = 0

    const setup = async () => {
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000000)

        const renderer = new THREE.WebGLRenderer({ antialias })
        renderer.setSize(window.innerWidth, window.innerHeight)
        document.querySelectorAll('canvas').forEach(canvas => canvas.remove())
        document.querySelector('.Game').appendChild(renderer.domElement)

        scene.add(mars)
        mars.position.set(0, 0, 0-(MARS_RADIUS + 250000))
        camera.position.set(0, 0, 20)

        //atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(3389500+150000, 100, 100)
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
        })
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
        mars.add(atmosphere)

        //spacecraft
        let loader = new GLTFLoader()
        let spacecraft = await (await loader.loadAsync('/assets/models/msl-aeroshell.gltf')).scene.children[0]
        scene.add(spacecraft)
        spacecraft.material = new THREE.MeshPhongMaterial({
            color: 0xffffff
        })

        //directional light for spacecraft
        let light = new THREE.DirectionalLight(0xffffff)
        light.position.set(1, 1, 10).normalize()
        scene.add(light)

        // ambient light
        const ambientlight = new THREE.AmbientLight(0xffffff, 0.1)
        scene.add(ambientlight)

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
        scene.add(stars)
        
        //orbit controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.target.set(spacecraft.position.x, spacecraft.position.y, spacecraft.position.z)
        controls.update()

        const clock = new THREE.Clock()

        let vel = initialVelocity
        let acc = GRAVITY
        let angleOfAttack = 68

        spacecraft.scale.set(2, 2, 2)
        spacecraft.rotation.x = toRadians(90)
        spacecraft.rotation.z = toRadians(angleOfAttack)
        
        const animate = () => {
            let deltaTime = clock.getDelta()
            vel += acc

            mars.position.z += Math.sin(toRadians(angleOfAttack)) * vel * deltaTime
            mars.rotation.y -= 0.000001 * Math.cos(toRadians(angleOfAttack)) * vel * deltaTime

            let alt = 0 - (mars.position.z + MARS_RADIUS)

            //drag
            if (sequence[phaseIndex].key === 'entry') {
                let density = 0.02 * Math.exp(-alt/11100)
                let dragNewtons = 0.5 * density * Math.pow(vel, 2) * profile.crossSectionArea
                let dragAcc = dragNewtons / profile.mass
                acc = GRAVITY - dragAcc
                spacecraft.material.color = new THREE.Color(0xffaaaa)
            } else {
                acc = GRAVITY
            }

            //next phase stuff
            let nextPhase = sequence[phaseIndex + 1]
            if (nextPhase === undefined) requestAnimationFrame(null)

            let nextPhaseTrigger = nextPhase.trigger[autonomyLevel] ?? nextPhase.trigger.full
            if (nextPhaseTrigger.type === 'altitude' && alt < nextPhaseTrigger.value) {
                phaseIndex++
            } else if (nextPhaseTrigger.type === 'velocity' && vel < nextPhaseTrigger.value) {
                phaseIndex++
            }

            //update UI
            setAltitude(alt)
            setVelocity(vel)
            setAcceleration(acc)
            setTimeElapsed(clock.elapsedTime)
            setNextPhaseUI(nextPhase)
            document.querySelector('.phase').innerHTML = sequence[phaseIndex].name
            document.querySelector('.guidence').innerHTML = sequence[phaseIndex].description[autonomyLevel]
            
            //animation loop
            requestAnimationFrame(alt>0 ? animate : animate)
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

        // setup()
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
            </div>

            <div className="sc-info">
                <p className="description">{profile.description}</p>
                {nextPhaseUI && (
                    <div className="upnext">
                        <p>Up Next</p>
                        <p>{nextPhaseUI.name}</p>
                        {nextPhaseUI.trigger.guided && autonomyLevel==='guided' ? (
                            <p>Awaiting input</p>
                        ) : (
                            <p>when {nextPhaseUI.trigger.full.type} = {nextPhaseUI.trigger.full.value}</p>
                        )}
                    </div>
                )}
            </div>

            {autonomyLevel !== 'none' && sequence[phaseIndex] && (
                <div className="guidence">
                    {sequence[phaseIndex].description && sequence[phaseIndex].description[autonomyLevel]}
                </div>
            )}

            {/* Canvas will be rendered here */}
        </div>
   )
}

export default Game