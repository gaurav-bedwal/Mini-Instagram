const { connect } = require('mongoose');
const Story = require('./models/Story');

async function test() {
  await connect('mongodb://localhost:27017/mini-insta');
  const count = await Story.countDocuments();
  console.log("Total Stories:", count);
  process.exit();
}
test();
