const mongoose = require('mongoose');

const subscriberSchema = mongoose.Schema({
  endpoint: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  keys: { type: mongoose.Schema.Types.Mixed }
},
{ timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
