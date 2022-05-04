import { useEffect, useState } from 'react'
import Link from 'next/link'

const EndScreen = () => {

    const [success, setSuccess] = useState('false')
    const [velocity, setVelocity] = useState(0)


    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        setSuccess(urlParams.get('success'))
        setVelocity(urlParams.get('velocity'))
    }, [])

    return (
        <div className="End">
            <div className="content">
                <h1>
                    The spacecraft {success==='true' ? 'successfuly touched down ' : 'unfortantely crashed '} 
                    on the surface of Mars at {velocity} m/s, {success==='true' ? 'congratulations!' : 'and suffered a rapid unscheduled dissasembly.'} 
                </h1>

                <Link href={'/'}>
                    <button className='menu-btn'>
                        Return to menu
                    </button>
                </Link>
            </div>
        </div>
    )
}

export default EndScreen
