import { useContext, useEffect, useState, useLayoutEffect } from 'react'
import { useRouter } from 'next/router'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import AppContext from '../../context'
import mars, { MARS_RADIUS } from '../../three/objects/mars'
import spacecraft from '../../three/objects/spacecraft'

const Game = () => {
    const router = useRouter()

    //read global states
    const { 
        selectedProfile: profile,
        autonomyLevel,
    } = useContext(AppContext)

    const setup = () => {
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000000)

        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
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

            mars.position.z += 1000 * 9.8 * deltaTime
            
            requestAnimationFrame(animate)
            renderer.render(scene, camera)
        }

        animate()

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    }

    const [sequence, setSequence] = useState([])
    const [phaseIndex, setPhaseIndex] = useState(0)

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
            { sequence[phaseIndex]?.name 
                ? <pre>{sequence[phaseIndex].name}</pre>
                : <pre>Loading...</pre> }

            {/* Canvas will be rendered here */}
        </div>
   )
}

export default Game