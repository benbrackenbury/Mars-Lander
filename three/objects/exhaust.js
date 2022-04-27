import * as THREE from 'three'

const exhaustGeometry = new THREE.ConeGeometry( 0.5, 2, 32 )

const exhaustMaterial = new THREE.MeshBasicMaterial({
    color: 0xff1111,
})

exhaustGeometry.translate( 0, 1, 0 )

const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial)

export default exhaust