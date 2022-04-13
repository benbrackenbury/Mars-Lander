import { useContext, useEffect, useState, useLayoutEffect } from 'react'
import { useRouter } from 'next/router'
import * as THREE from 'three'

import AppContext from '../../context'

const Game = () => {
    const router = useRouter()

    //read global states
    const { 
        selectedProfile: profile,
        autonomyLevel,
    } = useContext(AppContext)

    const setup = () => {
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight )
        document.querySelector('.Game').appendChild( renderer.domElement )

        const geometry = new THREE.BoxGeometry()
        const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
        const cube = new THREE.Mesh( geometry, material )
        scene.add( cube )

        camera.position.z = 5

        function animate() {
            requestAnimationFrame( animate )

            cube.rotation.x += 0.01
            cube.rotation.y += 0.01

            renderer.render( scene, camera )
        };

        animate()
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