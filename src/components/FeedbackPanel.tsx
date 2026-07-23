import { FormEvent, useState } from 'react'
import { CircleAlert, LoaderCircle, MessageSquareText, Send, Star } from 'lucide-react'
import { ApiError, submitFeedback } from '../lib/api'


const categories = ['general', 'onboarding', 'assessment', 'marketplace', 'wallet']


export function FeedbackPanel() {
  const [rating, setRating] = useState(5)
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      await submitFeedback({
        rating,
        category,
        message,
        page: window.location.pathname,
      })
      setMessage('')
      setStatus('sent')
    } catch (caughtError) {
      setStatus('idle')
      setError(caughtError instanceof ApiError ? caughtError.message : 'Feedback could not be submitted. Please try again.')
    }
  }

  return (
    <article className="dashboard-card feedback-panel">
      <div className="card-heading"><div><p className="overline">PRODUCT FEEDBACK</p><h2>Help improve SkillChain</h2></div><MessageSquareText size={20} /></div>
      <p>Share a short note about your experience. Your signed wallet session keeps feedback accountable.</p>
      {status === 'sent' ? (
        <div className="feedback-success"><Star size={17} /><span>Thanks—your feedback is now in the platform review queue.</span><button type="button" onClick={() => setStatus('idle')}>Send another</button></div>
      ) : (
        <form className="feedback-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Rating</legend>
            <div className="feedback-rating">
              {[1, 2, 3, 4, 5].map((value) => <button aria-label={`${value} star rating`} className={value <= rating ? 'active' : ''} type="button" key={value} onClick={() => setRating(value)}><Star size={17} fill="currentColor" /></button>)}
            </div>
          </fieldset>
          <label>Topic<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Your feedback<textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={4} maxLength={2000} placeholder="Tell us what worked well or needs attention." required /></label>
          {error && <p className="feedback-error"><CircleAlert size={15} /> {error}</p>}
          <button className="button button--primary" type="submit" disabled={status === 'sending'}>{status === 'sending' ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />} Send feedback</button>
        </form>
      )}
    </article>
  )
}
