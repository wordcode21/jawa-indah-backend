const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();
const axios  = require("axios"); 
const checkAuth = require("../middleware/checkAuth");
const apiKey = process.env.API_KEY_RAJAONGKIR;
const url = 'https://api.rajaongkir.com/starter';

router.post('/cek-ongkir',checkAuth ,async (req, res) => {
  const { destination} = req.body;
  const origin ="205";
  const courier = "jne";
  const weight = 1;

  if ( !destination || !weight ) {
    return res.status(400).json({ error: 'all parameters must be filled' });
  }

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'key': apiKey
    }
  };

  const data = new URLSearchParams({
    origin: origin.toString(),
    destination: destination.toString(),
    weight: weight.toString(),
    courier: courier
  });
  const costUrl = url+"/cost";

  try {
    const response = await axios.post(costUrl, data, config);
    const results = response.data.rajaongkir.results;
    const filteredResults = results.map(result => ({
        courier: result.name,
        services: result.costs
          .map(cost => ({
            service: cost.service,
            description: cost.description,
            cost: cost.cost[0].value,
            etd: cost.cost[0].etd
          }))
      })).filter(result => result.services.length > 0);
    res.json({data: filteredResults});
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'server eror' });
  }
});

router.get('/cek-kota', async (req, res) => {
    try {
        const config = {
            headers: {
                'key': apiKey
            }
        };
        const cityUrl = url+"/city";
        console.log(cityUrl);
        const response = await axios.get(cityUrl, config);
        const cities = response.data.rajaongkir.results.filter(city => city.province === 'Kalimantan Tengah');

        res.json({ cities });
    } catch (error) {
        console.error('Error:', error.response.data);
        res.status(500).json({ error: 'Server eror' });
    }
})

module.exports = router;