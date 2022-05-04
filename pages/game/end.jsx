import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const EndScreen = () => {
    const router = useRouter()

    useEffect(() => {
        if (!router.query.success || !router.query.vel) {
            router.push('/')
        }
    }, [])

    return (
        <div className="End">
            <div className="content">
                <h1>
                    The spacecraft {router.query.success==='true' ? 'successfuly touched down ' : 'unfortantely crashed '} 
                    on the surface of Mars at {router.query.velocity} m/s, {router.query.success==='true' ? 'congratulations!' : 'and suffered a rapid unscheduled dissasembly.'} 
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
