const mongoose = require('mongoose');

const conversionResultSchema = new mongoose.Schema({
    // Define schema fields here
    // For example:
    selectedCurrency: String,
    convertedAmount: Number,
    results: Object,
    // ...
});

const ConversionResult = mongoose.model('ConversionResult', conversionResultSchema);

module.exports = ConversionResult;


