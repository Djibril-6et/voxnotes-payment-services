require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

app.post("/create-checkout-session/:subject", async (req, res) => {
  try {
    const subject = req.params.subject;
    const { price } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: subject,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/souscription`,
    });

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/get-payment-details', async (req, res) => {
  try {
    const sessionId = req.body.sessionId;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paymentIntentId = session.payment_intent;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({ paymentIntent });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du paiement :', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des détails du paiement.' });
  }
});

app.post("/create-subscription/:subject", async (req, res) => {
  try {
    const subject = req.params.subject;
    const { price } = req.body;

    const product = await stripe.products.create({
      name: subject,
    });

    const stripePrice = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      recurring: {
        interval: "month",
      },
      unit_amount: price, // Montant en centimes (500 = 5€)
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/souscription`,
    });    

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/get-subscription-details', async (req, res) => {
  try {
    const sessionId = req.body.sessionId; 

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const subscriptionId = session.subscription;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    res.json({ subscription });
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de l'abonnement :", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des détails de l'abonnement." });
  }
});

app.post('/get-session-details', async (req, res) => {
  try {
    const sessionId = req.body.sessionId;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({ session });
  } catch (error) {
    console.error('Erreur lors de la récupération de la session :', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la session.' });
  }
});


app.listen(8080);