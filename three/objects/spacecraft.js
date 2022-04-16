import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

let initialVelocity = 5588


const spacecraftGeometry = new THREE.BoxGeometry(5, 5, 5)
const spacescraftMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
})

const spacecraft = new THREE.Mesh(spacecraftGeometry, spacescraftMaterial)

export default spacecraft
export { initialVelocity }