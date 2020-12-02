import FirebaseAuth from '../components/FirebaseAuth'
import { useRouter } from 'next/router'

const Auth = () => {
  const { asPath } = useRouter()
  console.log('asPath is', asPath)
  const nextPath = (asPath === '/join') ? '/' : asPath.replace('/join?nextPath=','')
  console.log('in auth nextPath', nextPath)
  return (
    <div>
      <h2>Join the Pace Community</h2>
      <ul>
        <li>Track and show your progress</li>
        <li>Connect with path creators and takers</li>
      </ul>
      <div>
        <FirebaseAuth nextPath={nextPath} />
      </div>
    </div>
  )
}

export default Auth
