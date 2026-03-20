const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { connect } = require('mongoose');
const User = require('./models/User');

async function test() {
  await connect('mongodb://localhost:27017/mini-insta');
  const user = await User.findOne({ username: 'demo' });
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123');
  
  const form = new FormData();
  form.append('media', fs.createReadStream('./package.json'));
  form.append('caption', 'Test test');
  
  try {
    const res = await axios.post('http://localhost:3000/stories', form, {
      headers: {
        ...form.getHeaders(),
        Cookie: `token=${token}`
      }
    });
    console.log('res.data:', res.data);
  } catch(err) {
    console.log('err response:', err.response?.data || err.message);
  }
  process.exit();
}
test();
