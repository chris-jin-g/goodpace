require('firebase-functions-test')()
const assert = require('assert')
const firebase = require('@firebase/testing')

const projectId = 'justpreppin'
const admin = firebase.initializeAdminApp({ projectId })

beforeEach(async () => {

  // add path
  admin.firestore()
    .collection('paths')
    .add({
      id: "p"
    })
})


it("can find the created path", async () => {
  const snap = await admin.firestore().doc('paths/p').get()
  const data = await snap.data()
  console.log(data)
  assert.equal(1,1, "1=1")
})