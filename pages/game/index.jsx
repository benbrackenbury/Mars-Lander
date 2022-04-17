import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import AppContext from '../../context'
import mars, { MARS_RADIUS, GRAVITY } from '../../three/objects/mars'
import { initialVelocity } from '../../three/objects/spacecraft'
import { calculateDrag } from '../../three/physics'

const toRadians = angle => angle * (Math.PI / 180)

const Game = () => {
    const router = useRouter()

    //read global states
    const { 
        selectedProfile: profile,
        autonomyLevel,
    } = useContext(AppContext)

    const [sequence, setSequence] = useState([])
    // const [phaseIndex, setPhaseIndex] = useState(0)
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [altitude, setAltitude] = useState(0)
    const [acceleration, setAcceleration] = useState(0)
    const [velocity, setVelocity] = useState(0)

    let phaseIndex = 0

    const setup = async () => {
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000000)

        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        document.querySelectorAll('canvas').forEach(canvas => canvas.remove())
        document.querySelector('.Game').appendChild(renderer.domElement)

        scene.add(mars)
        mars.position.set(0, 0, 0-(MARS_RADIUS + 250000))
        camera.position.set(0, 0, 20)
        // scene.add(spacecraft)

        let loader = new GLTFLoader()
        let spacecraft = await (await loader.loadAsync('/assets/models/msl-aeroshell.gltf')).scene.children[0]
        scene.add(spacecraft)
        spacecraft.material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            roughness: 0.5,
        })

        let light = new THREE.DirectionalLight(0xffffff)
        light.position.set(1, 1, 10).normalize()
        scene.add(light)
        
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
                // let drag = calculateDrag(vel, alt, profile.mass, profile.crossSectionArea)
                // acc = GRAVITY - drag
                let density = 0.02 * Math.exp(-alt/11100)
                let dragNewtons = 0.5 * density * Math.pow(vel, 2) * profile.crossSectionArea
                let dragAcc = dragNewtons / profile.mass
                acc = GRAVITY - dragAcc
            } else {
                acc = GRAVITY
            }

            //next phase stuff
            let nextPhase = sequence[phaseIndex + 1]
            if (nextPhase === undefined) requestAnimationFrame(null)

            let nextPhaseTrigger = nextPhase.trigger[autonomyLevel] ?? nextPhase.trigger.full
            if (nextPhaseTrigger.type === 'altitude' && alt < nextPhaseTrigger.value) {
                // setPhaseIndex(phaseIndex => phaseIndex + 1)
                phaseIndex++
            } else if (nextPhaseTrigger.type === 'velocity' && vel < nextPhaseTrigger.value) {
                // setPhaseIndex(phaseIndex => phaseIndex + 1)
                phaseIndex++
            }

            //set states for UI
            setAltitude(alt)
            setVelocity(vel)
            setAcceleration(acc)
            setTimeElapsed(clock.elapsedTime)
            document.querySelector('.phase').innerHTML = sequence[phaseIndex].name
            
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

            {/* Canvas will be rendered here */}
        </div>
   )
}

export default Game