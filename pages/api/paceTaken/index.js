import { admin } from "../../../utils/auth/firebaseAdmin"

export default async (req, res) => {
  const { method } = req

  switch (method) {
    case 'POST':
      return await handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

const handlePost = async (req, res) => {
  const { 
    body,
    cookies,
    query
  } = req
    
  // const auth = JSON.parse(cookies.auth)
  
  console.log('body', body) // The request body
  // console.log('auth', auth)
  
  if (!body || body === {}) res.status(400).json({ message: "No body found"})
  // if (!auth) res.status(400).json({ message: "No auth found"})
  
  // const decodedToken = await admin.auth().verifyIdToken(auth.token, true)
  //   .catch((error) => {
  //     console.log(error)
  //     res.status(500).json({ error })
  //   })
  // let uid = decodedToken.uid
  // console.log('uid', uid)
  
  const newDoc = await admin.firestore()
    .collection(`/paces:taken`)
    .add(body)
    .catch((error) => {
      console.log(error)
      res.status(500).json({ message: 'sumting wong', error: error })
    })
  console.log('gimme', newDoc.id)

  res.status(200).json({ message: 'success', id: newDoc.id })
}