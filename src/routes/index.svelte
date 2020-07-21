<script>
  import { onMount } from 'svelte'
  import { loadStripe } from '@stripe/stripe-js'

  const stripe = loadStripe('pk_test_hlsMh1YPnUHM8HFCYjTyDSky00xkVH48AY')

  let paymentButton
  // Disable the button until we have Stripe set up on the page
  let disabled = true
  let elements
  let card
  let cardElement

  // The items the customer wants to buy
  let purchase = {
    items: [{ id: 'xl-tshirt' }],
  }

  onMount(async () => {
    const res = await fetch('/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(purchase),
    })
    const data = await res.json()

    elements = stripe.elements()

    let style = {
      base: {
        color: '#32325d',
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#32325d',
        },
      },
      invalid: {
        fontFamily: 'Arial, sans-serif',
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    }

    card = await elements.create('card', { style })

    // Stripe injects an iframe into the DOM
    card.mount(cardElement)
    card.on('change', event => {
      // Disable the Pay button if there are no card details in the Element
      paymentButton.disabled = event.empty
      document.querySelector('#card-error').textContent = event.error
        ? event.error.message
        : ''
    })

    let form = document.getElementById('payment-form')

    form.addEventListener('submit', function (event) {
      event.preventDefault()
      // Complete payment when the submit button is clicked
      payWithCard(stripe, card, data.clientSecret)
    })
  })

  // Calls stripe.confirmCardPayment
  // If the card requires authentication Stripe shows a pop-up modal to
  // prompt the user to enter authentication details without leaving your page.
  function payWithCard(stripe, card, clientSecret) {
    loading(true)
    stripe
      .confirmCardPayment(clientSecret, {
        payment_method: {
          card,
        },
      })
      .then(function (result) {
        if (result.error) {
          // Show error to your customer
          showError(result.error.message)
        } else {
          // The payment succeeded!
          orderComplete(result.paymentIntent.id)
        }
      })
  }

  /* ------- UI helpers ------- */
  // Shows a success message when the payment is complete
  function orderComplete(paymentIntentId) {
    loading(false)
    document
      .querySelector('.result-message a')
      .setAttribute(
        'href',
        'https://dashboard.stripe.com/test/payments/' + paymentIntentId,
      )
    document.querySelector('.result-message').classList.remove('hidden')
    document.querySelector('button').disabled = true
  }

  // Show the customer the error from Stripe if their card fails to charge
  function showError(errorMsgText) {
    loading(false)
    let errorMsg = document.querySelector('#card-error')
    errorMsg.textContent = errorMsgText
    setTimeout(function () {
      errorMsg.textContent = ''
    }, 4000)
  }

  // Show a spinner on payment submission
  function loading(isLoading) {
    if (isLoading) {
      // Disable the button and show a spinner
      document.querySelector('button').disabled = true
      document.querySelector('#spinner').classList.remove('hidden')
      document.querySelector('#button-text').classList.add('hidden')
    } else {
      document.querySelector('button').disabled = false
      document.querySelector('#spinner').classList.add('hidden')
      document.querySelector('#button-text').classList.remove('hidden')
    }
  }
</script>

<h1>All good Inc.</h1>

<!-- Display a payment form -->
<form id="payment-form">
  <!--Stripe.js injects the Card Element-->
  <div bind:this={cardElement} />

  <button id="submit" bind:this={paymentButton} {disabled}>
    <div class="spinner hidden" id="spinner" />
    <span id="button-text">Pay</span>
  </button>

  <p id="card-error" role="alert" />

  <p class="result-message hidden">
    Payment succeeded, see the result in your
    <!-- <a href="" target="_blank">Stripe dashboard.</a> -->
    Refresh the page to pay again.
  </p>
</form>
