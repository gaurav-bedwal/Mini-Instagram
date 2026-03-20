const { connect, mongoose } = require('mongoose');
const Story = require('./models/Story');

async function test() {
  await connect('mongodb://localhost:27017/mini-insta');
  const stories = await Story.find().sort({ createdAt: -1 }).limit(5);
  console.log("RECENT STORIES:", stories.map(s => ({
    user: s.user,
    media: s.media,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt
  })));
  
  process.exit();
}
test();
