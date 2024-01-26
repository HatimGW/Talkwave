const mongoose = require('mongoose');

const groupChatSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required : true
  },
  messages: [
    {
      sender: {
        type: String,
      },
      name: {
        type: String,
      },
      message: {
        type: String,
      },
      time: {
        type: Date,
      },
    },
  ],
  members: [
    {
      type: String,
    },
  ],
  Admin:{
    type: String,
  }
});

const GroupChat = mongoose.model('GroupChat', groupChatSchema);

module.exports = GroupChat;
