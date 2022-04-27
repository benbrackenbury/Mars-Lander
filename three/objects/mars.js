import * as THREE from 'three'

const MARS_RADIUS = 3389500
const GRAVITY = 3.721

const marsGeometry = new THREE.SphereGeometry(MARS_RADIUS, 100, 100)
const marsMaterial = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load('/assets/img/mars.jpg'),
    bumpMap: new THREE.TextureLoader().load('/assets/img/mars-bump.jpg'),
    bumpScale: 1,
})
const mars = new THREE.Mesh(marsGeometry, marsMaterial)

export default mars
export { MARS_RADIUS, GRAVITY }