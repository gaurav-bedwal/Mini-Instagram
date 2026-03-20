const { connect } = require('mongoose');
const User = require('./models/User');

async function test() {
  await connect('mongodb://localhost:27017/mini-insta');
  const users = await User.find({ avatar: { $regex: 'photo-1502323777036' } });
  console.log("USERS WITH BROKEN AVATAR:", users.map(u => u.username));
  
  // Fix them automatically
  for (const u of users) {
    u.avatar = 'https://res.cloudinary.com/dfsfoolzs/image/upload/v1772177354/mini-insta/qdpgv1gh8zengxelzrni.png'; // giving them a valid fallback avatar
    await u.save();
  }
  process.exit();
}
test();
