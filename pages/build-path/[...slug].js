// https://nextjs.org/docs/routing/dynamic-routes#optional-catch-all-routes 
// https://github.com/vercel/next-site/blob/master/pages/docs/%5B%5B...slug%5D%5D.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import Link from 'next/link'

import { useUser } from '../../utils/auth/useUser'
import { getBootstrap, hashCode, sameAnswer } from '../../utils/common'
import { createPace, getNextBootstrap, updatePace } from '../../utils/path'

import { Hide } from '@styled-icons/boxicons-regular'

import { GoalHeading, BuildPaceLabel } from '../../components/Intro'
import { Question, PrevQuestion, NextQuestion} from '../../components/Question'
import { AnswerTextarea, AnswerYesNo } from '../../components/Answer'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

import { firebase } from '../../utils/data/database'
import { populateChild } from '../../utils/data/firestore'

import { Events } from '../../components/constants'

import moment from 'moment'

const getPrevQuestionUrl = (path, pace, seoTail) => {
  let prevQuestionUrl
  if (pace['prev:pace']) {
    prevQuestionUrl = `/build-path/${path.id}.${pace['prev:pace']}/${seoTail}`
  }
  return prevQuestionUrl
}

const getNextQuestionUrl = (path, pace, seoTail) => {
  let nextQuestionUrl
  if (pace['next:pace']) {
    nextQuestionUrl = `/build-path/${path.id}.${pace['next:pace']}/${seoTail}`
  } else {
    // console.log('if no next pace found, always create pace after ???')
    //nextQuestionUrl = await createPaceAfter(pace, nextBootstrap, seoTail)
  }
  return nextQuestionUrl
}

const createPaceAfter = async(pace, nextBootstrap, seoTail) => {
  console.log('pace', pace.id, pace.bootstrap, pace.order, pace.path, nextBootstrap, seoTail)
  
  // create pace in database, return id
  const newOrder = ++pace.order
  // hack for bootstrap y/n, to default n
  const defaultInstruction = (nextBootstrap === '3') ? '' : ''

  const newPaceId = await createPace({
    "bootstrap": nextBootstrap,
    "instruction": defaultInstruction,
    "order": newOrder,
    "path": pace.path,
    "prev:pace": pace.id
  })
  // construct next pace path with id: `/build-path/${path.id}.${newPaceId}/${seoTail}`
  console.log('newPaceId is', newPaceId)
  let url = `/build-path/${pace.path}.${newPaceId}/${seoTail}`
  return url
}

const Path = ({ path, mixpanel }) => {
  if (!path) { return <div>Loading ...</div> }
  
  const router = useRouter()
  const { asPath, isFallback, query } = router
  if (isFallback) { return <div>Loading .....</div> }  
  
  let { user, logout } = useUser()
  const author = path.author || 'unclaimed'
  
  const bootstrap = path.bootstrap
  const pace = path.thisPace
  const [instruction, setInstruction] = useState(pace.instruction)
  const [action, setAction] = useState(pace.action)
  const [showInstructionTip, setShowInstructionTip] = useState(true)
  const [showActionTip, setShowActionTip] = useState(true)
  const [nextQuestionUrl, setNextQuestionUrl] = useState()
  const [nextQuestion, setNextQuestion] = useState('')

  const pathElements = asPath.split('/')
  const seoTail = pathElements[pathElements.length - 1]

  const question = getBootstrap({
    pace,
    bootstrap,
    type: "question",
    index: pace.order,
    lastAnswer: path.previousInstruction,
    duration: path.duration
  })

  const prevQuestionUrl = getPrevQuestionUrl(path, pace, seoTail)
  // console.log('prevQuestionUrl', prevQuestionUrl)

  const nextBootstrap = getNextBootstrap(bootstrap, pace)
  // console.log('what is nextBootstrap', nextBootstrap)
  
  // nextUrl enables take-path to know what to do to send them back here 
  // (show preview mode and "back to building")
  const takePathPreviewUrl = `/take-path/${path.id}/${seoTail}`
  
  useEffect(() => {
    if (!nextQuestionUrl) {
      setNextQuestionUrl(getNextQuestionUrl(path, pace, seoTail))
      setNextQuestion((nextBootstrap === 'unset') ? '' : bootstrap.flow[nextBootstrap].question.replace('~~',''))
      // console.log('nextQuestion / url', nextQuestion, nextQuestionUrl)
    }    
  }, [nextQuestion, nextQuestionUrl])

  useEffect(() => {
    setShowInstructionTip(!(localStorage.getItem('hideInstructionTip')))
    setShowActionTip(!(localStorage.getItem('hideActionTip')))

    console.log('PATH', path)
    console.log('PACE', pace)
  }, [])

  return (
    <div className="container">
      
      <Header title={`To ${path.goal.text}, create the next pace`} />
      
      <main>
        <GoalHeading 
          goal={path.goal.text}
          onClickGoal={() => { console.log('go to paths related to', path.goal.text) }}
          
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
          
          // [Preview Icon -- Preview this path with nextUrl = thisUrl]
          previewUrl={takePathPreviewUrl}
        />

        <br />

        <BuildPaceLabel count={pace['order']} duration={path.duration} />

        {path.previousInstruction && path.previousBootstrap && !bootstrap.flow[path.previousBootstrap].forks && <div className="previousInstruction">Your previous instruction was: {path.previousInstruction}</div>}

        <div className="instructionHolder">
          <Question className="actionHeader" question={question} previousInstruction={path.previousInstruction} />
          <span className="dot">&nbsp;</span>

          { showInstructionTip && 
            <div id="instructionTip" className="instructionTip">
              <Hide className="hideTipBtn" onClick={(evt) => { 
                evt.preventDefault()
                document.getElementById('instructionTip').style.display = 'none'
                localStorage.setItem('hideInstructionTip', true)
              }} />
              <p className="pullQuote">Tip 💡<br/><br/>These questions are meant to guide your thought process and assist you to put your experiential knowledge into something easy to share with your audience.</p>
            </div>
          }
        </div> 

        <div className="responseHolder">
          <h2 className="actionHeader">Your Response</h2>
          <span className="dot">&nbsp;</span>

          <div className="responseInputHolder">

            { question.includes('~~')
              ? 
                <AnswerYesNo
                  onChange={async (e) => {
                    // console.log('update Y/N (e.target.value)', e.target.value)
                    const instructionText = e.target.value
                    const localKey = `pace:answer-instruction:${pace.id}`
                    if (!sameAnswer(instructionText, localKey)) {
                      console.log(instructionText, 'is different; updating')
                      updatePace(pace.id, {'instruction': instructionText})  
                      localStorage.setItem(localKey, hashCode(instructionText))
                      if (!nextQuestionUrl) {
                        const u = await createPaceAfter(pace, nextBootstrap, seoTail) 
                        setNextQuestionUrl(u)
                        setNextQuestion((nextBootstrap === 'unset') ? ' ' : bootstrap.flow[nextBootstrap].question.replace('~~',''))
                        console.log('setNextUrl to correct nextQuestionUrl', nextQuestionUrl, nextQuestion)

                        if (mixpanel) {
                          console.log('MP', Events.BUILD_PATH, { "nextPaceUrl": u })
                          mixpanel.track(Events.BUILD_PATH, { "nextPaceUrl": u })
                        }
                      } 
                    } else {
                      console.log(instructionText, 'same as before; did not update')
                    }
                  }} 
                  selected={instruction} />
              :
                <AnswerTextarea 
                  onChange={e => {
                    // console.log('update instruction', e.target.value)
                    setInstruction(e.target.value)
                  }}
                  onBlur={async event => {
                    const instructionText = event.target.value
                    const localKey = `pace:answer-instruction:${pace.id}`
                    
                    if (!sameAnswer(instructionText, localKey) && instructionText.length > 0) {
                      console.log(instructionText, 'is different; updating')

                      updatePace(pace.id, {'instruction': instructionText})  
                      localStorage.setItem(localKey, hashCode(instructionText))

                      if (!nextQuestionUrl) {
                        const u = await createPaceAfter(pace, nextBootstrap, seoTail) 
                        setNextQuestionUrl(u)
                        setNextQuestion((nextBootstrap === 'unset') ? '' : bootstrap.flow[nextBootstrap].question.replace('~~',''))
                        console.log('setNextUrl to correct nextQuestionUrl', nextQuestionUrl, nextQuestion)

                        if (mixpanel) {
                          console.log('MP', Events.BUILD_PATH, { "nextPaceUrl": u }) 
                          mixpanel.track(Events.BUILD_PATH, { "nextPaceUrl": u })
                        }
                      }
                    }
                    
                  }} 
                  // placeholder={answerPlaceholder}
                  value={instruction}
                />                
            }

            { pace.updatedAt && 
              <span className="timestamp">{author.displayName}&nbsp;({moment(pace.updatedAt).fromNow()})</span>
            }
            
          </div>
        </div>

        { action && 
          <div className="actionHolder">
            <h2 className="actionHeader">Now, describe the specific action needed</h2>
            <span className="dot">&nbsp;</span>

            { showActionTip && 
              <div id="actionTip" className="actionTip">
                <Hide className="hideTipBtn" onClick={(evt) => { 
                  evt.preventDefault()
                  document.getElementById('actionTip').style.display = 'none'
                  localStorage.setItem('hideActionTip', true)
                }} />
                <p className="pullQuote">Tip 💡<br/><br/>Write out the actual thing your audience needs to do to put your advice into action.</p>
              </div>
            }
            
            <br/>
            <div className="responseInputHolder">
              <AnswerTextarea 
                onChange={(e) => {
                  console.log('update action', e.target.value)
                  setAction(e.target.value)
                }}
                onBlur={event => {
                  const actionText = event.target.value
                  const localKey = `pace:answer-action:${pace.id}`
                  
                  if (!sameAnswer(actionText, localKey) && actionText.length > 0) {
                    console.log(actionText, 'is different; updating')
                    updatePace(pace.id, {'action': actionText})  
                    localStorage.setItem(localKey, hashCode(actionText))
                  } else {
                    console.log(actionText, 'same as before or empty; did not update')
                  }
                }} 
                // placeholder={answerPlaceholder}
                value={action}
              />
            </div>
          </div>
        } 
        
        <div className="paceNavContainer">
        { prevQuestionUrl &&
          <Link href={prevQuestionUrl}>
            <a className="prevQuestion">
              <PrevQuestion onClick={() => { console.log('load previous question') }} />
            </a>
          </Link>
        }
        { nextQuestionUrl && nextQuestion && 
          <Link href={nextQuestionUrl}>
            <a className="nextQuestion">
              <NextQuestion question={nextQuestion}
                onClick={() => { console.log('load next question', nextQuestion) }} />
            </a>
          </Link>
        }
        </div>
        
      </main>
    
      <Footer />
    </div>
  )
}


export async function getStaticProps({ params }) {
  try {
    const key = params.slug[0]
    let [ pathId, paceId ] = key.split('.')
    console.log('pathId', pathId, 'paceId', paceId)

    const doc = await firebase.firestore()
      .collection('paths')
      .doc(pathId)
      .get()
      .catch((error) => {
        console.log(error)
      })
    if (!doc) { 
      return {
        props: { path: {} }
      }
    }
    
    const data = doc.data()

    // popular references with data
    data.author = await populateChild(data, 'author', 'users') || null
    data.end = await populateChild(data, 'end', 'paces',
      ['id', 'order', 'bootstrap', 'instruction', 'prev:pace']) || null
    data.goal = await populateChild(data, 'goal', 'goals', ['text'])
    data.start = await populateChild(data, 'start', 'paces',
      ['id', 'order', 'bootstrap', 'instruction', 'next:pace']) || null
    
    console.log('start', data.start, 'end', data.end)
    // if there are only 2 paces remaining AND the first pace instruction is still empty, 
    // it's likely it's from create_path, so default to start
    if (data.start['next:pace'] === data.end.id && !data.start['instruction']) { paceId = data.start.id }
    // default to latest pace if not defined
    if (!paceId) { paceId = data.end.id }
    
    // lets get this pace's data 
    const paceDoc = await firebase.firestore()
      .collection('paces')
      .doc(paceId)
      .get()
      .catch((error) => res.status(400).json({ error }))
    if (!paceDoc) { throw { status: 404, message: 'pace not found' }}

    let thisPace = paceDoc.data()
    thisPace = Object.assign({ id: paceId, ...thisPace })
    
    // fetch previous instruction
    let previousInstruction, previousBootstrap
    if (thisPace['prev:pace']) {
      const prevPaceDoc = await firebase.firestore()
        .collection('paces')
        .doc(thisPace['prev:pace'])
        .get()
        .catch((error) => console.log('prevPaceDoc error', error))
      if (!prevPaceDoc) { console.log(`prevPaceDoc ${thisPace['prev:pace']} not found`) }
      const prevPace = prevPaceDoc.data()
      previousInstruction = prevPace.instruction || null
      previousBootstrap = prevPace.bootstrap
    }

    const bsDoc = await firebase.firestore()
      .collection('bootstrap')
      .doc('rpc:1')
      .get()
      .catch(console.log)
    const bootstrap = bsDoc.data()

    let path = {
      "id": pathId,
      "author": data.author,
      "bootstrap": bootstrap,
      "duration": data["pace:duration"],
      "end": data.end,
      "goal": data.goal,
      "next:order": data["next:order"],
      "start": data.start,
      "thisPace": thisPace
    }
    if (previousInstruction) path.previousInstruction = previousInstruction
    if (previousBootstrap) path.previousBootstrap = previousBootstrap

    console.log('staticProps path', path)
    return {
      props: { path }
    }
  } catch (error) {
    console.log(error)
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