const calculateDensity = (altitude) => {
    return 0.02 * Math.exp(-altitude/11100)
}

const calculateDrag = (altitude, velocity, mass, crossSectionArea) => {
    let dragNewtons = 0.5 * calculateDensity(altitude) * Math.pow(velocity, 2) * crossSectionArea
    return dragNewtons / mass
}

export { calculateDrag }