const { firebaseDb } = require("../config/firebase");

const fetch = require("node-fetch");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = process.env.PAYSTACK_API_URL;



const getBanks = async (req, res) => {
  const currency = req.query.currency || "ZAR";

  try {
    const response = await fetch(
      `${PAYSTACK_API_URL}/bank?currency=${currency}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json({ error: data });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getBanks
};
