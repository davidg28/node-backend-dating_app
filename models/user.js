const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const crypto = require('crypto');
const config = require("../config");

const User = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: false
  },
  city: {
    type: String,
    required: false
  },
  age: {
    type: Number,
    required: false
  },
  gender: {
    type: String,
    required: false
  },
  phoneNumber: {
    type: String,
    required: false
  },
  imagePath: {
    type: String,
    required: false
  },
  verified: {
    type: Boolean,
    required: false
  },
  quiz: {
    type: Object,
    required: false
  },
  expireDate: {
    type: String,
    required: false
  },
  assessment: {
    type: Object,
    required: false
  },
  fcmTokens: [{
    type: String,
    required: false
  }]
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

User.statics.create = function (body) {
  let password = body.password
  const encrypted = crypto.createHmac('sha1', config.secret)
    .update(password)
    .digest('base64');
  const user = new this({
    ...body,
    password: encrypted
  })
  return user.save();
}

User.statics.findOneByEmail = function (email) {
  return this.findOne({
    email: email.toLowerCase()
  }).exec();
}

User.methods.verify = function (password) {
  const encrypted = crypto.createHmac('sha1', config.secret)
    .update(password)
    .digest('base64');
  return (this.password === encrypted)
}

module.exports = mongoose.model("User", User);
