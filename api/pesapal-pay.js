import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { amount, email, phone } = req.body;
  if (!amount || !email || !phone) return res.status(400).json({ error: 'Missing required fields' });

  const consumerKey = process.env.PESAPAL_KEY;
  const consumerSecret = process.env.PESAPAL_SECRET;

  try {
    const tokenRes = await axios.post(
      'https://pay.pesapal.com/v3/api/Auth/RequestToken',
      {},
      {
        auth: { username: consumerKey, password: consumerSecret },
      }
    );

    const token = tokenRes.data.token;

    const order = {
      id: `ORDER_${Date.now()}`,
      currency: 'KES',
      amount,
      description: 'Payment from Flutter App',
      callback_url: 'https://yourapp.com/thankyou',
      billing_address: {
        email_address: email,
        phone_number: phone,
        first_name: 'John',
        last_name: 'Doe',
      },
    };

    const payRes = await axios.post(
      'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest',
      order,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.status(200).json({ redirect_url: payRes.data.redirect_url });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
}
