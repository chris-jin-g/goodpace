import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import moment from 'moment'
import { useUser } from '../utils/auth/useUser'
import { capitalize } from '../utils/common/index'

import { getWithFilter, populateChild } from '../utils/data/firestore'
import { IndexHeading } from '../components/Intro'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

// import signInAnonymously from '../utils/auth/authAnonymous'
// const fetcherUno = (url, token) =>
//   fetch(url, {
//     method: 'GET',
//     headers: new Headers({ 'Content-Type': 'application/json', token }),
//     credentials: 'same-origin',
//   }).then((res) => res.json())


export default function Home() {
  // Dashboard can use: https://swr.vercel.app/docs/global-configuration
  
  const { user, logout } = useUser()
  const router = useRouter()

  const [pathsBuilding, setPathsBuilding] = useState()
  const [pathsTaking, setPathsTaking] = useState()
  // const { data, error } = useSWR(
  //   user ? ['/api/getFood', user.token] : null,
  //   fetcherUno
  // )
  
  useEffect(() => {
    async function getPathsBuilding() {
      let paths = await getWithFilter('paths', [], [{ fieldPath: 'createdAt', direction: 'desc' }], 5)
      const pathsBuilding = await Promise.all(
        paths.map(async(p) => {
          p.author = await populateChild(p, 'author', 'users', ['id', 'displayName', 'avatarSource']) 
          return p
        })
      )
      setPathsBuilding(pathsBuilding)
    }

    async function getPathsTaking() {
      let paths = await getWithFilter('paths:taken', [], [{ fieldPath: 'createdAt', direction: 'desc' }], 5)
      const pathsTaking = await Promise.all(
        paths.map(async(p) => {
          p.taker = await populateChild(p, 'taker', 'users', ['id', 'displayName', 'avatarSource']) 
          return p
        })
      )
      setPathsTaking(pathsTaking)
    }
    
    getPathsBuilding()
    getPathsTaking()

    console.log('you are', user)
  }, [])

  return (
    
    <div className="container">
      
      <Header title="Pace" />

      <main>
        <IndexHeading 
          text="Welcome to Pace"
          me={user && user.id}
          myAvatar={user && user.avatarSource}
          onClickMe={(e) => { 
            e.preventDefault()
            console.log('go to my profile of', user.id) 
            router.push(`/profile/${user.id}`)
          }}
        />

        <h2 className="title">
          Our Mission
        </h2>
        <p>To level up how humans make progress by signaling clear paths toward goals they care for.</p>
        
        <div>
          <h3>Explore paths by the community</h3>
          
          <ul className="pathList">
            { pathsBuilding && pathsBuilding.length && pathsBuilding.map(p => {
              return (
                <li key={p.id} className="pathItem">
                  <Link href={`/profile/${p.author.id}`}>
                    <a>
                      <div>
                        <img className='avatar' src={p.author.avatarSource} />
                      </div>&nbsp;
                    </a>
                  </Link>
                  <Link href={`/take-path/${p.id}/raise-funds-for-a-startup`}>                    
                    <a className='last'>
                      <div className='last'>
                        <span className='title'>{ capitalize(p['goal:name']) }</span><br/>
                        By: {p.author.displayName},&nbsp; Created: { moment(p.createdAt).fromNow() }
                      </div>
                    </a>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <h3>Make your own path toward these goals</h3>
          <ul className="pathList">
            <li className="pathItem">
              <Link href={'/create-path/JyKThZBwes6mFClGi9J3/raise-funds-for-a-startup'}>
                <a className='last'>
                  <div className='last'>
                    <span className="title">How to raise funds for a startup</span>
                  </div>
                </a>
              </Link>
            </li>
          </ul>
        </div>
        
      </main>
      
      <Footer user={user} />

    </div>

  )
  
}



// import { fetcher } from '../utils/data/fetcher'

// const usePath = (pathId, paceId) => {
//   const { data, error, isValidating } = useSWR(pathId ? `/api/path/${pathId}.${paceId}` : null, fetcher)
//   const path = data || {}
//   const pathLoading = !data
//   const pathError = error
//   const pathValidating = isValidating
//   return { path, pathLoading, pathError, pathValidating }
// }

// const usePace = (whichPace, pathId) => {
//   let paceId
//   switch (whichPace) {
//     case "start":
//       paceId = path.start
//       break
//     case "end":
//       paceId = path.end
//       break
//     default:
//       paceId = path.thisPace
//   }
//   const { data, error, isValidating, mutate } = useSWR(paceId ? `/api/pace/${paceId}` : null, fetcher)
//   const pace = data || {}
//   const paceLoading = !data
//   const paceError = error
//   const paceValidating = isValidating
//   return { pace, paceLoading, paceError, paceValidating, mutate }
// }

// const useBootstrap = () => {
//   const { data, error } = useSWR('/api/bootstrap', fetcher)
  
//   return {
//     bootstrap: data,
//     isLoading: !error && !data,
//     isError: error,
//     replace: (text, props) => {
//       let returnText = text
//       const { index, lastAnswer, duration } = props

//       if (index) {
//         if (index === 0) {
//           returnText = returnText.replace('{nth}', 'first')
//         } else {
//           returnText = returnText.replace('{nth}', 'next')
//         }
//       }

//       if (lastAnswer && lastAnswer.length > 0) {
//         returnText = returnText.replace('{lastAnswer}', lastAnswer)
//       }

//       if (duration && duration.length > 0 ) {
//         returnText = returnText.replace('{duration}', duration)
//       }

//       return returnText
//     }
//   }
// }