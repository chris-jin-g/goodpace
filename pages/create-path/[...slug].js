import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import Link from 'next/link'

import signInAnonymously from '../../utils/auth/authAnonymous'
import { useUser } from '../../utils/auth/useUser'
import { fetch } from '../../utils/data/fetcher'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

import { firebase } from '../../utils/data/database'
import { Events } from '../../components/constants'

const CreatePath = ({ goal, mixpanel }) => {

  const createPath = async(user, goal) => {
    try {
      const data = {
        "author": user.id,
        "goal": goal.id,
      }
      const response = await fetch('/api/path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const pathResponse = await response.json()
      console.log('pathResponse', pathResponse)
      const pathId = pathResponse.pathId
      setPathUrl(`/build-path/${pathId}/${seoTail}`)

      return pathId
  
    } catch (error) {
      console.log('error', error)
      return null
    }
  }

  // if currentUser, use that
  let { user, logout } = useUser()
  
  const { asPath } = useRouter()
  const pathElements = asPath.split('/')
  const seoTail = pathElements[pathElements.length - 1]
  let [pathUrl, setPathUrl] = useState('')
  
  useEffect(() => {
    // if no currentUser, login anonymously
    if (!user) { 
      signInAnonymously()
    }
    console.log('user after useEffect', user)
  }, [goal])
  
  return (
    <div className="container">
      
      <Header title={`To ${goal.text}, create a path`} />
      
      <main>
        <Link href="/"><a target="_blank">About Pace</a></Link>
        <div>
          <h2>Great to have you here ✨</h2>
          <p>This place is all about leading a path toward a goal that others can follow in your footsteps.</p>
        </div>

        {
          goal && 
          <>
            <hr />
            <h2>The goal in focus is to <span className="goalText">{goal.text}</span> 🙌</h2>
            <p>{goal.rationale}</p>
          </>
        }  
        
        {/* https://medium.com/@efeng/the-importance-of-timing-in-startup-fundraising-1d0bdbb84bbd */}
        <p className="pullQuote">💡 Startup funding is measured in time. Every startup that isn’t profitable (meaning nearly all of them, initially) has a certain amount of time left before the money runs out and they have to stop. This is sometimes referred to as runway, as in “How much runway do you have left?” It’s a good metaphor because it reminds you that when the money runs out you’re going to be airborne or dead.<br/><br/>- Paul Graham</p>

        <h3>
          <a id="progressiveLink" className="progressiveLink" onClick={() => {
            console.log('user', user, 'goal', goal)
            if (user && goal && pathUrl.length === 0) {
              console.log('generating path ...')
              const newPathId = createPath(user, goal)

              if (mixpanel) {
                console.log('MP', Events.CREATE_PATH, { "pathId": newPathId })
                mixpanel.track(Events.CREATE_PATH, { "pathId": newPathId })
              }

              document.getElementById('getStarted').style.display = 'block'
              document.getElementById('progressiveLink').remove()
            }
          }}>✔️ That's right</a>
        </h3>
        
        <div id="getStarted" className="getStarted">
          <p>As a thought-leader, the experiential knowledge you pass on will be a <span className="underline md-tooltip--right" data-md-tooltip="pace by pace">step-by-step</span> path for your followers to stay on track.</p>
          <br />
          <Link href={pathUrl}><a id="buildPathUrl" className="buildPathUrl">OK. Let's Get Started </a></Link>
        </div>
        
      </main>
    
      <Footer />
      
    </div>
  )
}


export async function getStaticProps({ params }) {
  try {
    const goalId = params.slug[0]
    const doc = await firebase.firestore()
      .collection('goals')
      .doc(goalId)
      .get()
      .catch((error) => {
        console.log(error)
      })

    if (!doc) { throw { status: 404, message: 'Not found' }}
    
    const data = doc.data()
    let goal = {
      "id": doc.id,
      ...data
    }
    console.log('goalData', goal)

    return {
      props: { goal }
    }
  } catch (error) {
    console.log(error)
  }
}

// url contains: goal id, seo tail
// fallback: false -- so no blindly creating paths on goals that don't exist
//                 -- also Next will complain cannot get .text of undefined goal
export async function getStaticPaths() {
  return {
    paths: [
      { params: { slug: ['JyKThZBwes6mFClGi9J3', 'raise-funds-for-a-startup'] } },
    ],
    fallback: false
  }
}

export default CreatePath