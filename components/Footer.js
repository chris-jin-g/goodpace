import { FeedbackIcon } from './Icons'
import { PaceMenu } from './Menu'
import Modal from 'styled-react-modal'

const FeedbackModal = Modal.styled`
  background-color: white;
  height: 40rem;
  width: 40rem;

  & h1, h2, h3, h4 {
    text-align: center;
  }
  & h2 {
    color: ${ ({ theme }) => theme.colors.secondary };
    padding: 20px;
  }
  & div {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  & .email {
    color: ${ ({ theme }) => theme.colors.secondary };
    height: 20px;
    width: 420px;
    padding: 12px 20px;
    margin: 10px 20px;
  }
  & .message {
    padding: 12px 20px;
    margin: 0px 20px 20px;
    width: 420px;
  }
  & .sendBtn {
    background-color: white;
    cursor: pointer;
    font-size: 18px;
    padding: 8px 32px;
  }
  & .closeBtn {
    background-color: white;
    cursor: pointer;
    font-size: 18px;
    padding: 8px 32px;
  }
`

export const Footer = ({ user, logout }) => {
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false)
  function toggleModal() { setIsFeedbackModalOpen(!isFeedbackModalOpen) }
  const sendFeedback = async(evt) => {
    evt.preventDefault()
    const sendBtn = document.getElementById('sendBtn')
    const thanks = document.getElementById('thanks')
    const email = document.getElementById('feedbackEmail').value.trim()
    const message = document.getElementById('feedbackMessage').value.trim()
    const feedbackDoc = await firebase.firestore()
      .collection('/_feedback')
      .add({
        email: email,
        message: message
      })
      .catch(console.error)
    if (feedbackDoc && feedbackDoc.id) {
      sendBtn.style.display = 'none'
      thanks.style.display = 'block'
      closeBtn.style.display = 'block'
    }
  }
  return (
    <footer>
        <div className="feedback">
          <span className="md-tooltip--top" data-md-tooltip="Feedback">
            <FeedbackIcon onClick={toggleModal} />&nbsp;Feedback&nbsp;
            <FeedbackModal
              isOpen={isFeedbackModalOpen}
              onBackgroundClick={toggleModal}
              onEscapeKeydown={toggleModal}
            >  
              <h2>Feedback</h2>
              <h4>How can we do better?</h4>
              <div>
                <input type="text" id="feedbackEmail" className="email" placeholder="Email" />
              </div>
              <div>
                <textarea type="text" id="feedbackMessage" className="message" cols="60" rows="10" placeholder="Message"></textarea>
              </div>
              <div>
                <button id="sendBtn" className="sendBtn" onClick={(e) => sendFeedback(e)}>Send</button>
                <span id="thanks" className="thanks">👍 Got it. Thanks!</span>
              </div>
              <div>
                <button id="closeBtn" className="closeBtn" onClick={toggleModal}>Close</button>
              </div>
            </FeedbackModal>
          </span>
        </div>
        
        <div className="wrapper">
          <PaceMenu 
            user={user}
            onClickPace={() => { 
              console.log('...')
              logout()
            }}
          />
        </div>
        
      </footer>
  )
}