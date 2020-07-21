import sirv from 'sirv'
import express from 'express'
import compression from 'compression'
import * as sapper from '@sapper/server'
import initStripe from 'stripe'

const stripe = initStripe('sk_test_E8GKFWtgpCVF6TILGDe8yHqY00KQoqgSQo')

const { PORT, NODE_ENV } = process.env
const dev = NODE_ENV === 'development'
const app = express()

app.use(express.json())

const calculateOrderAmount = items => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400
}

app.post('/create-payment-intent', async (req, res) => {
  const { items } = req.body

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: 'usd'
  })

  res.send({
    clientSecret: paymentIntent.client_secret
  })
})

// You can also use Express
app.use(
  compression({ threshold: 0 }),
  sirv('static', { dev }),
  sapper.middleware()
)

app.listen(PORT, err => {
  if (err) console.log('error', err)
})
