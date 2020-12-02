import FirebaseAuth from '../components/FirebaseAuth'
import { useRouter } from 'next/router'

const Auth = () => {
  const { asPath } = useRouter()
  console.log('asPath is', asPath)
  const nextPath = (asPath === '/auth') ? '/' : asPath.replace('/auth?nextPath=','')
  console.log('in auth nextPath', nextPath)
  return (
    <div>

      <h2>Access your own account</h2>
      <div>
        <FirebaseAuth nextPath={nextPath} />
      </div>
    </div>
  )
}

export default Auth
