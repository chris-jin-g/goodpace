export default async(req, res) => {
  const docs = {
    "1": { 
      next: "2", 
      question: "What is the {nth} thing you need to do",
      answer: "The {nth} thing you need to do is ..."
    },
    "2": { 
      next: "3", 
      question: "What's the simplest way for someone to show a mastery of what you mentioned just now",
      answer: "The simplest thing they can do to show they have a grasp is to ..."
    },
    "3": { 
      next: { 
        y: "1-next", 
        n: "1-sub"
      },
      question: "~~Is this something anyone can do in {duration}"
    },
    "1-sub": { 
      next: "2", 
      question: "So what would be the first thing they need to do that can be done in {duration}",
      answer: "In {duration}, they can ..."
    },
    "1-next": { 
      next: "2", 
      question: "After seeing a satisfactory result, what's the next thing they need to do",
      answer: "The next thing they need to do is ..."
    }
  }
  res.status(200).json(docs)
}