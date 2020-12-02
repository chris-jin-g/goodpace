import { initFirebase, firebase } from '../../../utils/data/database'
import { populateChild } from '../../../utils/data/firestore'
initFirebase()

export default async (req, res) => {
  const { method } = req

  switch (method) {
    case 'GET':
      return await handleGet(req, res)
        
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

// used by /build-path and /path
const handleGet = async (req, res) => {
  const { query: { key } } = req
  
  let [ pathId, paceId ] = key.split('.')
  // console.log(pathId, paceId)

  try {
    const doc = await firebase.firestore()
      .collection('paths')
      .doc(pathId)
      .get()
      .catch((error) => {
        console.log(error)
        res.status(400).json({ error })
      })

    if (!doc) { res.status(404).json({ status: 404, message: 'Not found' })}
    
    // get the path document's data
    const data = doc.data()
    
    // popular references with data
    data.author = await populateChild(data, 'author', 'users') || null
    data.end = await populateChild(data, 'end', 'paces',
      ['id', 'order', 'bootstrap', 'instruction', 'prev:pace']) || null
    data.goal = await populateChild(data, 'goal', 'goals', ['text'])
    data.start = await populateChild(data, 'start', 'paces',
      ['id', 'order', 'bootstrap', 'instruction', 'next:pace']) || null

    // default to latest pace if not defined
    if (!paceId) { paceId = data.end.id }
  

    // lets get the pace's data 
    const paceDoc = await firebase.firestore()
      .collection('paces')
      .doc(paceId)
      .get()
      .catch((error) => res.status(400).json({ error }))
    if (!paceDoc) { return res.status(404).json({ status: 404, message: 'Not found' })}

    let thisPace = paceDoc.data()
    thisPace = Object.assign({ id: paceId, ...thisPace })

    let previousInstruction
    if (thisPace['prev:pace']) {
      const prevPaceDoc = await firebase.firestore()
        .collection('paces')
        .doc(thisPace['prev:pace'])
        .get()
        .catch((error) => console.log('prevPaceDoc error', error))
      if (!prevPaceDoc) { console.log(`prevPaceDoc ${thisPace['prev:pace']} not found`) }
      const prevPace = prevPaceDoc.data()
      previousInstruction = prevPace.instruction
    }

    let pathData = {
      "id": doc.id,
      "author": data.author,
      "duration": data["pace:duration"],
      "end": data.end,
      "goal": data.goal,
      "next:order": data["next:order"],
      "previousInstruction": previousInstruction,
      "start": data.start,
      "thisPace": thisPace
    }

    console.log('pathData', pathData)
    res.status(200).json(pathData)

  } catch (error) {
    console.log(error)
    res.status(500).json({ error })
  }

}


