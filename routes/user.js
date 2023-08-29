const express = require('express');
const axios = require('axios');

const router = express.Router();
const bcrypt = require('bcryptjs')
const User = require('../models/user')
const ConversionResult = require('../models/conversionModel');

const { handleRegister, handleLogin, handleLogout, handleDashboard } = require('../controllers/usercontroller')




router.get('/signup', (req, res) => {
    res.render('signup')
});

router.post('/signup', handleRegister)



// //login

router.get('/login', (req, res) => {
    res.render('login');
  });
  
  router.post('/login', handleLogin ) 


  
  //logout

  router.get('/logout', (req, res) => {
    res.render('login');
  });
  
  router.post('/logout', handleLogout )


// Dashboard

  router.get('/dashboard', handleDashboard);


// Conversion logic

const currencies = [
  "USD", "EUR", "GBP", "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL",
  "BSD", "BTC", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", "CLF",
  "CLP", "CNH", "CNY", "COP", "CRC", "CUC", "CUP", "CVE", "CZK", "DJF",
  // ... (and so on)
  "VUV", "WST", "XAF", "XCD", "XDR", "XOF", "XPF", "YER", "ZAR", "ZMW", "ZWL",
  "SCR", "SDG"
];




router.get('/dashboard/conversion', (req, res) => {
  res.render('index', {
      currencies,
      initialCurrency: '',
      nairaAmount: '',
      selectedCurrency: '',
  });
});

router.post('/dashboard/convert', (req, res) => {
  const nairaAmount = parseFloat(req.body.nairaAmount);
  const selectedCurrency = req.body.selectedCurrency;
  const customConversionRate = parseFloat(req.body.customConversionRate);

  const convertedAmount = nairaAmount / customConversionRate;

  res.render('result', { nairaAmount, selectedCurrency, convertedAmount, currencies });
});

router.post('/dashboard/finalConvert', async (req, res) => {
  const selectedCurrency = req.body.selectedCurrency;
  const convertedAmount = parseFloat(req.body.convertedAmount);
  const conversionRates = {};

  // Convert conversion rates to numbers
  for (const currency in req.body) {
      if (currency.startsWith('conversionRates[')) {
          const rate = parseFloat(req.body[currency]);
          const currencyCode = currency.match(/\[(.*?)\]/)[1];
          conversionRates[currencyCode] = rate;
      }
  }

  // Debugging: Output form data to console
  console.log("Form Data Received:", req.body);

  const results = {};

  // Calculate the converted amounts for each currency using the conversion rates
  for (const currency in conversionRates) {
      if (conversionRates.hasOwnProperty(currency)) {
          const rate = parseFloat(conversionRates[currency]);
          const convertedValue = rate * convertedAmount;
          results[currency] = convertedValue.toFixed(2); // Convert to fixed decimal places
      }
  }

  // Debugging: Output calculated results to console
  console.log("Calculated Results:", results);

  try {
  //     // Create a new instance of the ConversionResult model
  //    // Save the results to the database
    const conversionResult = new ConversionResult({
      selectedCurrency,
      convertedAmount,
      conversionRates,
      results,
    });

    await conversionResult.save();

    res.render('finalresult', { selectedCurrency, convertedAmount, results });
  } catch (error) {
    console.error("Error calculating and saving results:", error);
    res.status(500).send("Error calculating and saving results");
  }
});


















// automated


router.get('/dashboard/autoconversion', (req, res) => {
  res.render('autoindex', {
    currencies,
    initialCurrency: '',
    nairaAmount: '',
    selectedCurrency: '',
  });
});

// router.post('/dashboard/autoconvert', async (req, res) => {
//   const nairaAmount = parseFloat(req.body.nairaAmount);
//   const selectedCurrency = req.body.selectedCurrency;
//   const currency_one = 'NGN'; // Assuming the base currency is always NGN

//   try {
//     // Fetch the conversion rates from the API
//     const response = await fetch(`https://v6.exchangerate-api.com/v6/4f50fae0954705094ca1a31e/latest/${currency_one}`);
//     const data = await response.json();

//     if (data.result === 'success') {
//       const conversionRates = data.conversion_rates;
//       const customConversionRate = conversionRates[selectedCurrency];

//       const convertedAmount = nairaAmount * customConversionRate;

//       res.render('autoresult', {
//         nairaAmount,
//         selectedCurrency,
//         convertedAmount,
//         currencies
//       });
//     } else {
//       console.error("API request failed:", data.error);
//       res.status(500).send("API request failed");
//     }
//   } catch (error) {
//     console.error("Error fetching conversion rates:", error);
//     res.status(500).send("Error fetching conversion rates");
//   }
// });

router.post('/dashboard/autoconvert', async (req, res) => {
  const nairaAmount = parseFloat(req.body.nairaAmount);
  const selectedCurrency = req.body.selectedCurrency;

  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/4f50fae0954705094ca1a31e/latest/${selectedCurrency}`);
    const data = await response.json();
    const exchangeRates = data.conversion_rates;
    const rate = exchangeRates[selectedCurrency];
    const convertedAmount = (nairaAmount / rate).toFixed(2);

    res.render('autoresult', { nairaAmount, selectedCurrency, convertedAmount });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).send('Error fetching exchange rates');
  }
});


router.post('/dashboard/autofinalConvert', async (req, res) => {
  const selectedCurrency = req.body.selectedCurrency;
  const convertedAmount = parseFloat(req.body.convertedAmount);
  const currency_one = 'NGN'; // Assuming the base currency is always NGN

  try {
    // Fetch the conversion rates from the API
    const response = await fetch(`https://v6.exchangerate-api.com/v6/4f50fae0954705094ca1a31e/latest/${currency_one}`);
    const data = await response.json();

    if (data.result === 'success') {
      const conversionRates = data.conversion_rates;

      const results = {};

      // Fetch the conversion rate for the selected currency
      const customConversionRate = parseFloat(conversionRates[selectedCurrency]);

      // Calculate the converted amounts for each currency using the fetched conversion rates
      for (const currency in conversionRates) {
        if (conversionRates.hasOwnProperty(currency)) {
          const rate = parseFloat(conversionRates[currency]);

          // Calculate the conversion using the fetched rate and the custom conversion rate
          const convertedValue = (convertedAmount / customConversionRate) * rate;
          results[currency] = convertedValue.toFixed(2);
        }
      }

      res.render('autofinalresult', { selectedCurrency, convertedAmount, results });
    } else {
      console.error("API request failed:", data.error);
      res.status(500).send("API request failed");
    }
  } catch (error) {
    console.error("Error fetching conversion rates:", error);
    res.status(500).send("Error fetching conversion rates");
  }
});






router.post('/dashboard/saveresult', async (req, res) => {
    const selectedCurrency = req.body.selectedCurrency;
    const convertedAmount = req.body.convertedAmount;
    const results = JSON.parse(req.body.results);

    try {
    //     // Create a new ConversionResult document
    //     const newConversionResult = new ConversionResult({
    //         selectedCurrency: selectedCurrency,
    //         convertedAmount: convertedAmount,
    //         results: results
    //     });

    //     // Save the document to the database
    //     await newConversionResult.save();

        res.redirect('/user/dashboard/viewresult'); // Redirect to view saved results
    } catch (error) {
        console.error("Error saving result:", error);
        res.status(500).send("Error saving result");
    }
});



router.get('/dashboard/viewresult', async (req, res) => {
  try {
    const savedResults = await ConversionResult.find();
    res.render('viewresult', { results: savedResults });
  } catch (error) {
    console.error("Error retrieving saved results:", error);
    res.status(500).send("Error retrieving saved results");
  }
});


router.get('/dashboard/view', async (req, res) => {
  try {
      const savedResults = await ConversionResult.find(); // Fetch saved results from the database
      res.render('view', { results: savedResults }); // Pass the conversions data to the template
  } catch (error) {
      console.error("Error retrieving saved results:", error);
      res.status(500).send("Error retrieving saved results");
  }
});


// delete

router.post('/dashboard/clearresults', async (req, res) => {
  try {
    await ConversionResult.deleteMany({}); // Delete all saved results
    res.redirect('/user/dashboard/viewresult'); // Redirect back to the viewresult page
  } catch (error) {
    console.error("Error clearing results:", error);
    res.status(500).send("Error clearing results");
  }
});



module.exports = router;