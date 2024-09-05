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

app.post("/create-subscription/:subject", async (req, res) => {
  try {
    const subject = req.params.subject;
    const additionalData = req.body.additionalData;

    const product = await stripe.products.create({
      name: subject,
    });

    const price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      recurring: {
        interval: "month",
      },
      unit_amount: 1000, // Montant en centimes (500 = 5€)
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/subdetails?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/profile`,
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


app.listen(8080);