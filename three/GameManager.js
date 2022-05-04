import * as THREE from 'three'
import mars, { MARS_RADIUS } from './objects/mars'

class GameManager {
    static shared = new GameManager()

    constructor() {
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000000)
        this.setupMars()
    }

    setupMars() {
        this.scene.add(mars)
        const STARTING_ALTITUDE = 131000
        mars.position.set(0, 0, -(MARS_RADIUS + STARTING_ALTITUDE))
        this.camera.position.set(0, 0, 20)
    }
}

export default GameManager