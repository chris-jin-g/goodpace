import { admin } from "../../../utils/auth/firebaseAdmin";

export default async (req, res) => {
  const { method } = req;
  console.log(req);

  switch (method) {
    case "GET":
      return await handleGet(req, res);
    case "PUT":
      return await handlePut(req, res);
    default:
      res.setHeader("Allow", ["GET", "PUT"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

// Return a pace's worth of info
const handleGet = async (req, res) => {
  const {
    query: { id }
  } = req;
  console.log("user/<id> :: req.query.id", id);

  try {
    const doc = await admin
      .firestore()
      .collection("users")
      .doc(id)
      .get()
      .catch(error => {
        res.status(400).json({ error });
      });

    if (!doc) {
      return res.status(404).json({ status: 404, message: "Not found" });
    }

    const data = await doc.data();
    let userData = {
      id: doc.id,
      ...data
    };
    // console.log('userData', userData)
    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ error });
  }
};

const handlePut = async (req, res) => {
  const { body, cookies, query } = req;

  const auth = JSON.parse(cookies.auth);

  console.log("userId", query.id); // The url query string
  console.log("body", body); // The request body
  console.log("auth", auth);

  if (!query.id) res.status(400).json({ message: "No id found" });
  if (!body) res.status(400).json({ message: "No data found" });
  if (!auth) res.status(400).json({ message: "No auth found" });

  const userId = query.id;

  const decodedToken = await admin
    .auth()
    .verifyIdToken(auth.token, true)
    .catch(error => {
      console.log("decodedToken error", error);
      res.status(500).json({ error });
    });
  let uid = decodedToken.uid;
  console.log("uid", uid);

  // TODO this allows anyone to overwrite any user profile
  await admin
    .firestore()
    .doc(`/users/${userId}`)
    .set(body, { merge: true })
    .catch(error => {
      console.log("sad panda");
      res.status(500).json({ error });
    });
  res.status(200).json({ message: "user save success" });
};
