import { useContext, useEffect, useState, useLayoutEffect } from 'react'
import { useRouter } from 'next/router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

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
    } = useContext(AppContext)

    const [sequence, setSequence] = useState([])
    const [phaseIndex, setPhaseIndex] = useState(0)
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [altitude, setAltitude] = useState(0)
    const [acceleration, setAcceleration] = useState(0)
    const [velocity, setVelocity] = useState(0)

    let currentPhaseIndex = 0 

    const setup = () => {
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000000)

        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        document.querySelectorAll('canvas').forEach(canvas => canvas.remove())
        document.querySelector('.Game').appendChild(renderer.domElement)

        scene.add(mars)
        // scene.add(spacecraft)

        let spacecraft
        let loader = new THREE.ObjectLoader()
        fetch('/assets/models/msl-aeroshell.json')
            .then(obj => obj.json())
            .then(obj => {
                spacecraft = loader.parse(obj).children[0]
                scene.add(spacecraft)
                spacecraft.material = new THREE.MeshBasicMaterial({
                    color: 0x555555
                })
                spacecraft.rotation.z = toRadians(angleOfAttack)
                spacecraft.rotation.x = toRadians(angleOfAttack)
                spacecraft.scale.set(2, 2, 2)
            })

        const overheadLight = new THREE.PointLight(0xffffff, 1, 10)
        scene.add(overheadLight)

        mars.position.set(0, 0, 0-(MARS_RADIUS + 250000))
        camera.position.set(0, 0, 20)
        
        //orbit controls
        const controls = new OrbitControls(camera, renderer.domElement)
        // controls.target.set(spacecraft.position.x, spacecraft.position.y, spacecraft.position.z)
        // controls.update()

        const clock = new THREE.Clock()

        let vel = initialVelocity
        let acc = GRAVITY
        let angleOfAttack = 68

        // spacecraft.rotation.y = toRadians(-angleOfAttack)
        
        const animate = () => {
            let deltaTime = clock.getDelta()
            vel += acc

            mars.position.z += Math.sin(toRadians(angleOfAttack)) * vel * deltaTime
            mars.rotation.y -= 0.000001 * Math.cos(toRadians(angleOfAttack)) * vel * deltaTime

            let alt = 0 - (mars.position.z + MARS_RADIUS)

            //drag

            //next phase stuff
            let nextPhase = sequence[phaseIndex + 1]
            if (nextPhase === undefined) requestAnimationFrame(null)

            let nextPhaseTrigger = nextPhase.trigger[autonomyLevel] ?? nextPhase.trigger.full
            if (nextPhaseTrigger.type === 'altitude' && alt < nextPhaseTrigger.value) {
                setPhaseIndex(phaseIndex => phaseIndex + 1)
            } else if (nextPhaseTrigger.type === 'velocity' && vel < nextPhaseTrigger.value) {
                setPhaseIndex(phaseIndex => phaseIndex + 1)
            }

            //set states for UI
            setAltitude(alt)
            setVelocity(vel)
            setAcceleration(acc)
            setTimeElapsed(clock.elapsedTime)
            
            //animation loop
            requestAnimationFrame(alt>0 ? animate : null)
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

    useEffect(() => {
        currentPhaseIndex = phaseIndex
        console.log('change', {phaseIndex, currentPhaseIndex})
    }, [phaseIndex])

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

            {/* Canvas will be rendered here */}
        </div>
   )
}

export default Game