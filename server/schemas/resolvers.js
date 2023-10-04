const { jwtSecret } = require('../config/config');
const { User, Capsule } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
const resolvers = {
  Query: {
    getAllCapsules: async () => {
      try {
        const capsules = await Capsule.find();
        return capsules;
      } catch (error) {
        console.error("Error fetching all capsules:", error);
        throw error;
      }
    },
    getTimeCapsule: async (parent, { id }) => {
      try {
        const capsule = await Capsule.findById(id);
        return capsule;
      } catch (error) {
        console.error(`Error fetching capsule with ID ${id}:`, error);
        throw error;
      }
    },
  },
  Mutation: {
    login: async (parent, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user) {
        console.error('User not found in database:', username);
        throw new AuthenticationError('Invalid username or password');
      }
      const validPassword = await user.isCorrectPassword(password);
      if (!validPassword) {
        console.error('Password does not match for user:', username);
        throw new AuthenticationError('Invalid username or password');
      }
      if (!user._id || !user.username || !user.email) {
        console.error('User data is missing:', user);
        throw new Error('User data is missing or incomplete');
      }
      const token = jwt.sign({ id: user._id, username: user.username }, jwtSecret, { expiresIn: '24h' });
      return user;
    },
    registerUser: async (parent, { username, email, password }) => {
      const user = new User({ username, email, password });
      await user.save();
      return user;
    },
    createCapsule: async (parent, { input }) => {
      try {
        const capsule = new Capsule({
          title: input.title,
          userId: input.userId,
          letter: input.letter,
          openDate: input.openDate,
          photoURLs: input.photoURLs,
        });
        await capsule.save();
        return capsule;
      } catch (error) {
        console.error("Error in createCapsule resolver:", error);
        throw error;
      }
    },
    updateCapsule: async (parent, { id, input }) => {
      const capsule = await Capsule.findByIdAndUpdate(id, input, { new: true });
      return capsule;
    },
    deleteCapsule: async (parent, { id }) => {
      const capsule = await Capsule.findByIdAndDelete(id);
      return capsule ? true : false;
    },
    openCapsule: async (parent, { id }) => {
      const capsule = await Capsule.findById(id);
      if (!capsule) {
        throw new Error('Capsule not found');
      }
      const currentDate = new Date();
      const openDate = new Date(capsule.openDate);
      if (currentDate < openDate) {
        throw new Error('The capsule is not ready to be opened yet.');
      }
      capsule.isOpened = true;
      await capsule.save();
      return capsule;
    },
  },
};
module.exports = resolvers;