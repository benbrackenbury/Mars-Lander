import { useContext, useEffect, useState, useLayoutEffect } from 'react'
import { useRouter } from 'next/router'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import AppContext from '../../context'
import mars, { MARS_RADIUS, GRAVITY } from '../../three/objects/mars'
import spacecraft, { initialVelocity } from '../../three/objects/spacecraft'

const Game = () => {
    const router = useRouter()

    //read global states
    const { 
        selectedProfile: profile,
        autonomyLevel,
    } = useContext(AppContext)

    const [sequence, setSequence] = useState([])
    const [phaseIndex, setPhaseIndex] = useState(0)
    const [altitude, setAltitude] = useState(0)

    const setup = () => {
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000000)

        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        document.querySelectorAll('canvas').forEach(canvas => canvas.remove())
        document.querySelector('.Game').appendChild(renderer.domElement)

        scene.add(mars)
        scene.add(spacecraft)

        mars.position.set(0, 0, 0-(MARS_RADIUS + 250000))
        camera.position.set(0, 0, 20)
        
        //orbit controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.target.set(spacecraft.position.x, spacecraft.position.y, spacecraft.position.z)
        controls.update()

        const clock = new THREE.Clock()
        
        function animate() {
            let deltaTime = clock.getDelta()

            mars.position.z += initialVelocity * GRAVITY * deltaTime

            let alt = spacecraft.position.z - (mars.position.z + MARS_RADIUS)
            setAltitude(alt)

            let nextPhase = sequence[phaseIndex++]
            console.log(sequence)
            
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
    }, [])

    useEffect(setup, [])

    return profile && (
        <div className="Game">
            <div className="telemetry">
                { sequence[phaseIndex]?.name 
                    ? <p className="phase">{sequence[phaseIndex].name}</p>
                    : <p>Loading...</p>
                }

                <p>Altitude: {Math.floor(altitude)} km</p>
            </div>

            {/* Canvas will be rendered here */}
        </div>
   )
}

export default Game