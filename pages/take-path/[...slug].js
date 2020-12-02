import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import Link from 'next/link'

import signInAnonymously from '../../utils/auth/authAnonymous'
import { useUser } from '../../utils/auth/useUser'
import { fetch } from '../../utils/data/fetcher'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { IndexHeading } from '../../components/Intro'

import { firebase } from '../../utils/data/database'
import { Events } from '../../components/constants'

import moment from 'moment'

const TakePath = ({ path, mixpanel }) => {
  console.log('pathhh', path)
  const takePath = async(user, path) => {
    try {
      const data = {
        "taker": user.id,
        "path": path.id,
      }
      const response = await fetch('/api/pathTaken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(error => console.log(error))

      const pathResponse = await response.json()
      console.log('pathResponse', pathResponse)
      const pathTakenId = pathResponse.pathId
      setPathTakenUrl(`/path/${pathTakenId}/${seoTail}`)

      return pathTakenId

    } catch (error) {
      console.log('error', error)
      return null
    }
  }

  // if currentUser, use that
  let { user, logout } = useUser()
  const router = useRouter()
  const { asPath } = router
  const pathElements = asPath.split('/')
  const seoTail = pathElements[pathElements.length - 1]
  let [pathTakenUrl, setPathTakenUrl] = useState('')

  const authorProfileUrl =  path ? `/profile/${path.author}` : ''
  // console.log('path.authorIntro', path && !!path.authorIntro)
  const authorIntro = path && !!path.authorIntro ? path.authorIntro : '🤷 Not much was found on this author'
  useEffect(() => {
    // if no currentUser, login anonymously
    if (!user) { 
      signInAnonymously()
    }
    console.log('user after useEffect', user)
  }, [path])
  

  return (
    <div className="container">
      { path && 
        <Header title={`To ${path['goal:name']}, take this path`} />
      }
      
      <main>
        <IndexHeading 
            text="Pace"
            onClickTitle={ e => { 
              e.preventDefault()
              router.push('/')
            }}
            me={user && user.id}
            myAvatar={user && user.avatarSource}
            onClickMe={(e) => { 
              e.preventDefault()
              console.log('go to my profile of', user.id) 
              router.push(`/profile/${user.id}`)
            }}
          />
        
        {
          path &&
          <div>
            <h2>Your goal is to {path['goal:name']} ✨</h2>
            <p>This place is all about taking a path toward a goal that others have crafted based on their experience.</p>
          </div>
        }
        
        {
          path && 
          <>
            <hr />
            { 
              path['goal:rationale'] &&
              <>
                <h3>Why this path</h3>
                <p>{path['goal:rationale']}</p>
              </>
            }
            
            <h3 className="pathHeading">About the author</h3>
            <p className="pullQuote">
              <Link href={authorProfileUrl}>
                <a id="authorProfileUrl" className="authorProfileUrl">{path.authorDisplayName}</a>
              </Link>
              <br /><br />
              <span>{authorIntro}</span>
            </p>

            <h3 className="pathHeading">
              <a id="progressiveLink" className="progressiveLink" onClick={() => {
                console.log('user', user, 'path', path)
                if (user && path) {
                  console.log('taking path ...')
                  const pathTakenId = takePath(user, path)

                  if (mixpanel) {
                    console.log('MP', Events.TAKE_PATH, { "pathTakenId": pathTakenId })
                    mixpanel.track(Events.TAKE_PATH, { "pathTakenId": pathTakenId })
                  }

                  document.getElementById('getStarted').style.display = 'block'
                  document.getElementById('progressiveLink').remove()
                }
              }}>Show me more</a>
            </h3>
            
            <div id="getStarted" className="getStarted">
              <h3 className="pathHeading">About this path</h3>
              <p>Created <span className="underline md-tooltip--right" data-md-tooltip={moment(path.createdAt).format("dddd, MMMM Do YYYY, h:mm:ss a")}>{moment(path.createdAt).fromNow()}</span>, this path has <span className="underline md-tooltip--right" data-md-tooltip="paces">steps</span> that each take roughly {path['pace:duration']} to do.</p>
              <br />
              <Link href={pathTakenUrl}><a id="pathTakenUrl" className="buildPathUrl">I'm in. Let's go!</a></Link>
            </div>
          </>
        }  
                
      </main>
    
      <Footer />
    </div>
  )
}


export async function getStaticProps({ params }) {
  try {
    const pathId = params.slug[0]
    const doc = await firebase.firestore()
      .collection('paths')
      .doc(pathId)
      .get()
      .catch((error) => {
        console.log(error)
      })

    if (!doc) { throw { status: 404, message: 'Not found' }}
    
    const data = doc.data()
    const authorDocPath = `/users/${data.author}`
    const authorDoc = await firebase.firestore()
      .doc(authorDocPath)
      .get()
      .catch(console.log)
    const authorData = authorDoc.data()
    const intro = authorData.authorIntro || ''
    let path = {
      "id": pathId,
      ...data,
      authorDisplayName: authorData.displayName,
      authorAvatar: authorData.avatarSource,
      authorIntro: intro,
    }
    console.log('path in get static props', path)

    return {
      props: { path }
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
      // { params: { slug: ['JyKThZBwes6mFClGi9J3', 'raise-funds-for-a-startup'] } },
    ],
    fallback: true
  }
}

export default TakePath