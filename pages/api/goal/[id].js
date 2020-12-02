import { admin } from "../../../utils/auth/firebaseAdmin"

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

// Return a pace's worth of info
const handleGet = async (req, res) => {
  const { query: { id } } = req
  console.log('goal/<id>/_ :: req.query.id', id)

  try {
    const doc = await admin.firestore()
      .collection('goals')
      .doc(id)
      .get()
      .catch((error) => {
        error()
        res.status(400).json({ error })
      })

    if (!doc) { return res.status(404).json({ status: 404, message: 'Not found' })}
    
    const data = await doc.data()
    let goalData = {
      "id": doc.id,
      ...data
    }
    console.log('goalData', goalData)
    res.status(200).json(goalData)

  } catch (error) {
    
    res.status(500).json({ error })
  }

}
