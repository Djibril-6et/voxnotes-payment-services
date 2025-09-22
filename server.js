require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const axios = require('axios');

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
    const { price, userId } = req.body;

    console.log("Requête reçue pour /create-checkout-session:");
    console.log("Subject:", subject);
    console.log("Price:", price);
    console.log("User ID:", userId);

    // Vérifier que userId est bien présent
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Créer la session Stripe
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
            unit_amount: price, // Montant en centimes
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/souscription`,
    });

    console.log("Session Stripe créée avec succès:", session.id);

    // Préparer les données pour le serveur BDD
    const paymentData = {
      userId: userId,
      stripeSessionId: session.id,
      paymentMethod: 'Stripe',
      amountPaid: price / 100, // Convertir en euros
      status: 'active',
    };

    console.log("Envoi des données de paiement au serveur BDD:", paymentData);

    // Intégration du bloc try...catch pour l'appel à l'API du serveur BDD
    try {
      const dbResponse = await axios.post(`${process.env.BDD_URL}/api/subscriptions`, paymentData);

      console.log("Réponse du serveur BDD:", dbResponse.status, dbResponse.data);

      if (dbResponse.status === 201) {
        // Paiement créé avec succès dans la base de données
        res.json({ url: session.url });
      } else {
        // Échec de la création du paiement dans la base de données
        await stripe.checkout.sessions.expire(session.id); // Annuler la session
        res.status(500).json({ error: 'Échec de la création du paiement dans la base de données. Paiement annulé.' });
      }
    } catch (dbError) {
      console.error('Erreur lors de la création du paiement dans la base de données :', dbError);

      if (dbError.response) {
        // La requête a été faite et le serveur a répondu avec un statut d'erreur
        console.error('Data:', dbError.response.data);
        console.error('Status:', dbError.response.status);
        console.error('Headers:', dbError.response.headers);
      } else if (dbError.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Request:', dbError.request);
      } else {
        // Quelque chose s'est passé lors de la configuration de la requête
        console.error('Error Message:', dbError.message);
      }

      // Annuler la session Stripe
      await stripe.checkout.sessions.expire(session.id);
      res.status(500).json({ error: 'Échec de la création du paiement dans la base de données. Paiement annulé.' });
    }

  } catch (e) {
    console.error('Erreur lors de la création de la session de paiement :', e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/create-subscription/:subject", async (req, res) => {
  try {
    const subject = req.params.subject;
    const { price, userId } = req.body;

    // Vérifier que userId est bien présent
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Créer le produit et le prix sur Stripe
    const product = await stripe.products.create({
      name: subject,
    });

    const stripePrice = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      recurring: {
        interval: "month",
      },
      unit_amount: price, // Montant en centimes
    });

    // Créer la session Stripe
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

    console.log("Session Stripe créée avec succès:", session.id);

    // Préparer les données pour le serveur BDD
    const subscriptionData = {
      userId: userId,
      stripeSessionId: session.id,
      paymentMethod: 'Stripe',
      amountPaid: price / 100, // Convertir en euros
      status: 'active',
    };

    console.log("Envoi des données de souscription au serveur BDD:", subscriptionData);

    // Intégration du bloc try...catch pour l'appel à l'API du serveur BDD
    try {
      const dbResponse = await axios.post(`${process.env.BDD_URL}/api/subscriptions`, subscriptionData);
      
      console.log("Réponse du serveur BDD:", dbResponse.status, dbResponse.data);

      if (dbResponse.status === 201) {
        // Souscription créée avec succès dans la base de données
        res.json({ url: session.url });
      } else {
        // Échec de la création de la souscription dans la base de données
        await stripe.checkout.sessions.expire(session.id);
        res.status(500).json({ error: 'Échec de la création de la souscription dans la base de données. Abonnement annulé.' });
      }
    } catch (dbError) {
      console.error('Erreur lors de la création de la souscription dans la base de données :', dbError);

      if (dbError.response) {
        // La requête a été faite et le serveur a répondu avec un statut d'erreur
        console.error('Data:', dbError.response.data);
        console.error('Status:', dbError.response.status);
        console.error('Headers:', dbError.response.headers);
      } else if (dbError.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Request:', dbError.request);
      } else {
        // Quelque chose s'est passé lors de la configuration de la requête
        console.error('Error Message:', dbError.message);
      }

      // Annuler la session Stripe
      await stripe.checkout.sessions.expire(session.id);
      res.status(500).json({ error: 'Échec de la création de la souscription dans la base de données. Abonnement annulé.' });
    }

  } catch (e) {
    console.error('Erreur lors de la création de la souscription :', e);
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

app.post('/cancel-subscription', async (req, res) => {
  try {
    const { stripeSessionId } = req.body;

    if (!stripeSessionId) {
      return res.status(400).json({ error: "Stripe Session ID is required" });
    }

    // Récupérer la session Stripe pour obtenir l'ID d'abonnement
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    
    if (!session.subscription) {
      return res.status(400).json({ error: "No subscription found for this session." });
    }

    const subscriptionId = session.subscription;

    // Annuler l'abonnement via Stripe
    const canceledSubscription = await stripe.subscriptions.del(subscriptionId);

    console.log('Abonnement annulé avec succès:', canceledSubscription.id);

    // Envoyer la requête de suppression au serveur BDD en utilisant stripeSessionId
    console.log(`Suppression de la souscription avec stripeSessionId: ${stripeSessionId}`);

    try {
      // Appeler l'API pour supprimer l'abonnement dans la base de données
      const dbResponse = await axios.delete(`${process.env.BDD_URL}/api/subscriptions/${stripeSessionId}`);

      if (dbResponse.status === 200) {
        res.json({ message: 'Subscription deleted successfully from the database.' });
      } else {
        res.status(500).json({ error: 'Failed to delete subscription from the database.' });
      }
    } catch (dbError) {
      console.error('Erreur lors de la suppression de la souscription dans la base de données:', dbError);
      res.status(500).json({ error: 'Failed to delete subscription from the database after Stripe cancellation.' });
    }
  } catch (e) {
    console.error('Erreur lors de l\'annulation de l\'abonnement :', e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 9030;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
