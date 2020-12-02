import { admin } from "../../../utils/auth/firebaseAdmin"
// import { populateChild } from '../../../utils/data/firestore'


export default async (req, res) => {
  const { method } = req

  switch (method) {
    case 'GET':
      return await handleGet(req, res)
    case 'POST':
      return await handlePost(req, res)
    
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

// find paths by user id
const handleGet = async (req, res) => {
  const { query: { u } } = req
  console.log('getting paths of user', u)
  const uid = u

  try {
    const pathQuery = await admin.firestore()
      .collection('paths')
      .where('author', '==', uid)
      .get()
      .catch((error) => {
        console.log(error)
        res.status(500).json({ message: 'path query failed' })
      })
    
    if (!pathQuery.docs) {
      res.status(404).json({ message: 'no paths found'})  
    }

    const paths = pathQuery.docs.map((path) => path.data())
    res.status(200).json(paths)

  } catch (error) {
    console.log(error)
    res.status(500).json({ error })
  }

}

// Used by /create-path
// One path per goal per account
const handlePost = async (req, res) => {
  const { 
    body,
    cookies,
    query
  } = req
  
  console.log('body', body) // The request body
  if (!body.author) res.status(400).json({ message: "No author found"})
  if (!body.goal) res.status(400).json({ message: "No text found"})

  const goalId = body.goal
  
  const auth = JSON.parse(cookies.auth)
  const decodedToken = await admin.auth().verifyIdToken(auth.token, true)
    .catch((error) => {
      console.log(error)
      res.status(500).json({ error })
    })
  let uid = decodedToken.uid
  console.log('posting create-path as', uid, goalId)

  try {
    // return existing path if one is already found for this user
    // only ONE path per goal per user
    const pathQuery = await admin.firestore()
      .collection('/paths')
      .where('goal', '==', goalId)
      .where('author', '==', uid)
      .get()
      .catch((error) => {
        console.log(error)
        res.status(500).json({ message: 'path query failed' })
      })
    
    if (pathQuery.docs && pathQuery.docs.length > 0) {
      const pathFound = pathQuery.docs[0]
      console.log('pathDoc found', pathFound.data())
      return res.status(200).json({ message: 'existing path found', pathId: pathFound.id })
    }

    // first path for this user for this goal, add it
    const goalQuery = await admin.firestore()
      .doc(`/goals/${goalId}`)
      .get()
      .catch((error) => {
        console.log(error)
        res.status(500).json({ message: 'invalid goal found' })
      })
    const goalData = goalQuery.data()
    const goalName = goalData.text
    const goalRationale = goalData.rationale
    const newPathDoc = await admin.firestore()
      .collection('/paths')
      .add({
        "author": uid,
        "goal": goalId,
        "goal:name": goalName,
        "goal:rationale": goalRationale,
        "next:order": 1,
        "pace:duration": "1 hour or less"
      })
      .catch((error) => { 
        console.log(error)
        res.status(500).json({ message: 'path creation failed' })
      })
    const newPathData = await newPathDoc.get()
    
    res.status(200).json({ message: 'path created', pathId: newPathData.id })  
  
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error' })
  }
}