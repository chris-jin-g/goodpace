import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import Link from 'next/link'

import { useUser } from '../../utils/auth/useUser'
import { getBootstrap, hashCode, sameAnswer, capitalize, lowercase } from '../../utils/common'
import { createPaceTakenAfter, updatePaceTaken } from '../../utils/path'

import { GoalHeading, PaceLabel } from '../../components/Intro'
import { PrevQuestion, NextQuestion } from '../../components/Question'
import { AnswerTextarea } from '../../components/Answer'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

import { firebase } from '../../utils/data/database'
import { populateChild, getWithFilter, getDoc } from '../../utils/data/firestore'

import { Events } from '../../components/constants'

import moment from 'moment'

const getNextPaceTakenUrl = (path, paceTaken, seoTail) => {
  let nextPaceTakenUrl
  if (paceTaken['next:pace:taken']) {
    nextPaceTakenUrl = `/path/${path.id}.${paceTaken['next:pace:taken']}/${seoTail}` 
  }
  return nextPaceTakenUrl
}

const getPrevQuestionUrl = (path, paceTaken, seoTail) => {
  let prevQuestionUrl
  if (paceTaken['prev:pace:taken']) {
    prevQuestionUrl = `/path/${path.id}.${paceTaken['prev:pace:taken']}/${seoTail}`
  }
  return prevQuestionUrl
}


const Path = ({ path, mixpanel }) => {
  if (!path) { return <div>Loading ...</div> }
  
  if (path == {}) { return <div>Not found</div> }

  const router = useRouter()
  const { asPath, isFallback, query } = router
  if (isFallback) { return <div>Loading .....</div> }  
  
  let { user, logout } = useUser()
  let author = path.originPath.author || 'unclaimed'

  // console.log('user', user, 'author', author)
  
  const bootstrap = path.bootstrap
  const paceTaken = path.thisPaceTaken
  const [response, setResponse] = useState(paceTaken.response)
  const [nextPaceTakenUrl, setNextPaceTakenUrl] = useState()

  const pathElements = asPath.split('/')
  const seoTail = pathElements[pathElements.length - 1]
  
  const [actionablePace, setActionablePace] = useState(path.actionablePace)
  const [paceTakenUpdatedAt, setPaceTakenUpdatedAt] = useState(paceTaken.updatedAt)

  const prevQuestionUrl = getPrevQuestionUrl(path, paceTaken, seoTail)

  useEffect(() => {
    if (!nextPaceTakenUrl) {
      setNextPaceTakenUrl(getNextPaceTakenUrl(path, paceTaken, seoTail))
      console.log('useEffect nextPaceTakenUrl', nextPaceTakenUrl)
    }
  }, [nextPaceTakenUrl])

  useEffect(() => {
    // http://localhost:3000/path/UEbh45IXQ92mhMJqiTkS/raise-funds-for-a-startup

    console.log('PATH', path)
    console.log('PACE TAKEN', paceTaken)
  }, [])

  return (

    <div className="container">
      
      <Header title={`To ${path["goal:name"]}, create the next pace`} />
      
      <main>

        {
          (user && user.id === path.taker) ??
          <>
            <p>This path is for peopple looking to {path["goal:name"]} For those who aren't logged in or not yet taken this path, <a href="">Take this path</a></p>  
          </>
        }
        
        { user &&
          <GoalHeading 
            goal={path["goal:name"]}
            onClickGoal={() => { console.log('go to paths related to', path["goal:name"]) }}
            
            author={author && author.id}
            authorName={author && author.displayName}
            onClickAuthor={(e) => { 
              e.preventDefault()
              console.log('go to creator profile of', author.id)
              router.push(`/profile/${author.id}`)
            }} 

            me={user && user.id}
            myAvatar={user && user.avatarSource}
            onClickMe={(e) => { 
              e.preventDefault()
              console.log('go to my profile of', user.id) 
              router.push(`/profile/${user.id}`)
            }}
          />
        }

        <br />

        <PaceLabel count={paceTaken['order:taken']} duration={path.originPath['pace:duration']} />

        <div className="instructionHolder">
          <h2 className="actionHeader">{capitalize(actionablePace.preamble[0].instruction)}</h2>
          <span className="dot">&nbsp;</span>
          <div className="paceContent">
            {
              actionablePace.preamble.map((element, idx) => (
                
                  <div key={idx}>
                    <p>{getBootstrap({
                        pace: element, 
                        bootstrap, 
                        type:'answer', 
                        index: element.order,
                        duration: path.duration
                      })} <span className='instruction'>{lowercase(element.instruction)}</span></p>
                  </div>
                
              )) 
            }
            <p>{bootstrap.flow[actionablePace.bootstrap].answer} <span className='instruction'>{actionablePace.instruction}</span>.</p>
          </div>
        </div>
        
        <div className="responseHolder">
          <h2 className="actionHeader">Your Response</h2>
          <span className="dot">&nbsp;</span>

          <div className="responseInputHolder">
            {actionablePace.action}
            <p className="lightSubhead">Take {path.originPath["pace:duration"]}. Your submission is private by default.</p>
            
            <AnswerTextarea 
              onChange={e => {
                setResponse(e.target.value)
              }}
              onBlur={async e => {
                const text = e.target.value
                const localKey = `pace:taken-response:${paceTaken.id}`
                
                if (!sameAnswer(text, localKey) && text.length > 0) {
                  console.log(text, 'is different; updating')
                  const newPaceTaken = {text}

                  updatePaceTaken(paceTaken.id, newPaceTaken)  
                  localStorage.setItem(localKey, hashCode(text))
                  setPaceTakenUpdatedAt(moment()) 
                  if (!nextPaceTakenUrl) { 
                    const u = await createPaceTakenAfter(paceTaken, bootstrap, seoTail)
                    setNextPaceTakenUrl(u)
                    console.log('onBlur', nextPaceTakenUrl)

                    if (mixpanel) {
                      console.log('MP', Events.START_PATH, { "nextPaceTakenUrl": u })
                      mixpanel.track(Events.START_PATH, { "nextPaceTakenUrl": u })
                    }
                  }
                }

              }} 
              value={response}
            />
            
            { paceTakenUpdatedAt && 
              <span className="timestamp">{author.displayName}&nbsp;({moment(paceTakenUpdatedAt).fromNow()})</span>
            }
          </div>
        
          <div className="paceNavContainer">
          { prevQuestionUrl &&
            <Link href={prevQuestionUrl}>
              <a className="prevQuestion">
                <PrevQuestion onClick={() => { console.log('load previous question') }} />
              </a>
            </Link>
          }
          { nextPaceTakenUrl &&  
            <Link href={nextPaceTakenUrl}>
              <a className="nextQuestion">
                <NextQuestion question=''
                  onClick={() => { console.log('load next pace:taken') }} />
              </a>
            </Link>
          }
          </div>
        </div>

      </main>
    
      <Footer />
    </div>
  )
}


// From bootstrap and path, find the total count of paces that are actionable
const getActionablePaceCount = async(bootstrap, path) => {
  const paces = await getWithFilter('paces', 
    [
      { fieldPath: 'path', operator: '==', value: path.id },
      { fieldPath: 'bootstrap', operator: 'in', value: bootstrap.actionables }, 
    ],
    [
      { fieldPath: 'createdAt', direction: 'asc' }
    ])
  return paces.length
}

// Given a paceTaken, collect previous informational pace instructions as preamble and return
const buildPaceContext = async(bootstrap, paceTaken) => {
  let originPace = await getDoc('paces', paceTaken.originPace)
  
  let currentPace
  let paceId = originPace['prev:pace']
  let preamble = []

  try {
    while (true) {
      
      // if there's no previous (already at beginning of the list), return
      if (!paceId) return {
        ...originPace,
        preamble,
      }

      // find the prev pace
      currentPace = await getDoc('paces', paceId)
  
      if (bootstrap.actionables.includes(currentPace.bootstrap)) {
        // if actionable, return instructions
        return {
          ...originPace,
          preamble,
        }
      } else {
        // else collect preamble from non-forks (instructional) paces, get prev pace until it's actionable
        if (!bootstrap['forks:at'].includes(currentPace.bootstrap)) {
          preamble.push({ bootstrap: currentPace.bootstrap, order: currentPace.order, instruction: currentPace.instruction })
        }
        paceId = currentPace['prev:pace']
      } 
    }  
  } catch (error) {
    console.log(error)
    return {}
  }
}

// Given a path:taken and optionally a bookmark (pace:taken id), return the pace:taken 
const getPaceTaken = async(pathTaken, bookmark=null) => {
  // if bookmark is undefined, take pathTaken.start as bookmark
  if (!bookmark) bookmark = pathTaken.start

  return await getDoc('paces:taken', bookmark)
}




export async function getStaticProps({ params }) {
  // Get the path meta data
  // Get the first pace entirely
  try {
    const key = params.slug[0]
    let [ pathTakenId, paceTakenId ] = key.split('.')
    console.log('pathTakenId', pathTakenId, 'paceTakenId', paceTakenId)

    // first the path
    const doc = await firebase.firestore()
      .collection('paths:taken')
      .doc(pathTakenId)
      .get()
      .catch((error) => {
        console.log(error)
      })
    if (!doc) { 
      return {
        props: {path: {}}
      }
    }
    
    const pathTaken = doc.data()
    console.log('pathtakennnn', pathTaken)

    if (pathTaken) {
      // popular references with data
      pathTaken.taker = await populateChild(pathTaken, 'taker', 'users') || null
      pathTaken.path = await populateChild(pathTaken, 'path', 'paths', ['id', 'author', 'createdAt', 'start', 'pace:duration'])
      pathTaken.path.author = await populateChild(pathTaken.path, 'author', 'users', ['id', 'displayName', 'avatarSource'])

      const bsDoc = await firebase.firestore()
        .collection('bootstrap')
        .doc('rpc:1')
        .get()
        .catch(console.log)
      const bootstrap = bsDoc.data()

      const actionablePaceCount = await getActionablePaceCount(bootstrap, pathTaken.path)

      const thisPaceTaken = await getPaceTaken(pathTaken, paceTakenId)

      const actionablePace = await buildPaceContext(bootstrap, thisPaceTaken)

      let path = {
        "id": pathTakenId,
        "originPath": pathTaken.path,
        "taker": pathTaken.taker,
        "duration": pathTaken["pace:duration"],
        "goal": pathTaken.goal,
        "goal:name": pathTaken["goal:name"],
        "next:order:taken": pathTaken["next:order:taken"],
        "bootstrap": bootstrap,
        "actionablePaceCount": actionablePaceCount,
        "actionablePace": actionablePace,
        "thisPaceTaken": thisPaceTaken
      }

      console.log('staticProps pathTaken', path)
      return {
        props: { path }
      }

    } else {
      return {
        props: { }
      }
    }
    

  } catch (error) { 
    console.log(error) 
    return {
      props: {path: {}}
    }
  }
}

/**
 * The paths returned from getStaticPaths will be rendered to HTML at build time.
 * The paths that have not been generated at build time will not result in a 404 page. 
 * Instead, Next.js will serve a “fallback” version of the page on the first request 
 * to such a path (see “Fallback pages” below for details).
 * 
 * In the background, Next.js will statically generate the requested path HTML and JSON. 
 * This includes running getStaticProps.
 * When that’s done, the browser receives the JSON for the generated path. This will be 
 * used to automatically render the page with the required props. From the user’s 
 * perspective, the page will be swapped from the fallback page to the full page.
 * 
 * At the same time, Next.js adds this path to the list of pre-rendered pages. Subsequent 
 * requests to the same path will serve the generated page, just like other pages 
 * pre-rendered at build time.
 */
export async function getStaticPaths() {
  return {
    paths: [
      // { params: { slug: ['I40QH2eSb6SVI7DV3ifh', 'raise-funds-for-a-startup'] } },
      // { params: { slug: ['p', 'default-path'] } },
    ],
    fallback: true
  }
}

export default Path