import { admin } from "../../../utils/auth/firebaseAdmin"

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
    const pathTakenQuery = await admin.firestore()
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

// Used by /take-path to create a paths:taken doc
// One pathTaken per path per account
const handlePost = async (req, res) => {
  const { 
    body,
    cookies,
    query
  } = req
  
  console.log('body', body) // The request body
  if (!body.taker) res.status(400).json({ message: "No taker found"})
  if (!body.path) res.status(400).json({ message: "No path found"})

  const pathId = body.path
  
  const auth = JSON.parse(cookies.auth)
  const decodedToken = await admin.auth().verifyIdToken(auth.token, true)
    .catch((error) => {
      console.log(error)
      return res.status(401).json({ message: 'Unauthorized', error: error })
    })
  let uid = decodedToken.uid

  // Don't allow take path creation if taker id doesn't match decoded uid
  if (uid !== body.taker) { res.status(401).json({ message: 'unauthorized '})}
  
  console.log('posting take-path as', uid, pathId)

  try {
    // return existing pathTaken if one is already found for this user
    // only ONE pathTaken per path per taker
    const pathTakenQuery = await admin.firestore()
      .collection('/paths:taken')
      .where('path', '==', pathId)
      .where('taker', '==', uid)
      .get()
      .catch((error) => {
        console.log(error)
        res.status(500).json({ message: 'path query failed' })
      })
    
    if (pathTakenQuery.docs && pathTakenQuery.docs.length > 0) {
      const pathFound = pathTakenQuery.docs[0]
      console.log('pathTaken doc found', pathFound.data())
      return res.status(200).json({ message: 'existing pathTaken found', pathId: pathFound.id })
    }

    // first time this taker is taking this path, add it
    const pathQuery = await admin.firestore()
      .doc(`/paths/${pathId}`)
      .get()
      .catch((error) => {
        console.log(error)
        res.status(500).json({ message: 'error in getting take path' })
      })
    const pathData = pathQuery.data()
    const pathBootstrap = pathData.bootstrap
    const pathDuration = pathData['pace:duration']
    const goalId = pathData.goal
    const goalName = pathData['goal:name']
    const newPathTakenDoc = await admin.firestore()
      .collection('/paths:taken')
      .add({
        "bootstrap": pathBootstrap,
        "taker": uid,
        "path": pathId,
        "goal": goalId,
        "goal:name": goalName,
        "next:order:taken": 1,
        "pace:duration": pathDuration
      })
      .catch((error) => { 
        console.log(error)
        res.status(500).json({ message: 'pathTaken creation failed' })
      })
    const newPathData = await newPathTakenDoc.get()
    
    res.status(200).json({ message: 'pathTaken created', pathId: newPathData.id })  
  
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error' })
  }
}