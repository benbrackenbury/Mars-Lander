import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

//spacecraft
let spacecraft = new THREE.Group()
let heatshield, parachute, aeroshell, airbag
let loader = new GLTFLoader()

const setupSpacecraft = async () => {
    aeroshell = await (await loader.loadAsync('/assets/models/aeroshell.gltf')).scene.children[0]
    spacecraft.add(aeroshell)
    aeroshell.material = new THREE.MeshPhongMaterial({
        color: 0xffffff
    })
    //heatshield
    heatshield = await (await loader.loadAsync('/assets/models/heatshield.gltf')).scene.children[0]
    spacecraft.add(heatshield)
    heatshield.material = new THREE.MeshPhongMaterial({
        color: 0x888888
    })
    //parachute
    parachute = await (await loader.loadAsync('/assets/models/parachute.gltf')).scene.children[0]
    spacecraft.add(parachute)
    parachute.material = new THREE.MeshPhongMaterial({
        color: 0xffffff
    })
    //airbag
    airbag = await (await loader.loadAsync('/assets/models/airbag.gltf')).scene.children[0]
    spacecraft.add(airbag)
    airbag.material = new THREE.MeshPhongMaterial({
        color: 0xffffff
    })
}


export default spacecraft
export {setupSpacecraft, heatshield, parachute, aeroshell, airbag, loader}