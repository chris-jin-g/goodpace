// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default (req, res) => {
  console.log(req.headers)
  console.log(req.url)
  console.log(req.method)
  console.log(req.query)
  console.log(req.body)

  res.statusCode = 200
  res.json({ name: 'Good Pace' })
}
