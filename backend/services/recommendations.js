const User = require('../models/User');

class RecommendationService {
  /**
   * Recommends friends for a given user.
   *
   * Basic initial strategy:
   * 1. Exclude the user themselves.
   * 2. Exclude users who are already friends.
   * 3. Prioritize users with mutual interests.
   * 4. Limit the number of recommendations.
   *
   * @param {string} userId - The ID of the user for whom to generate recommendations.
   * @param {number} limit - The maximum number of recommendations to return.
   * @returns {Promise<Array<User>>} - A list of recommended user profiles.
   */
  static async recommendFriends(userId, limit = 10) {
    try {
      const currentUser = await User.findById(userId).populate('friends');
      if (!currentUser) {
        throw new Error('User not found');
      }

      const currentUserFriendIds = currentUser.friends.map(friend => friend._id.toString());
      const currentUserInterests = currentUser.profile.interests || [];

      // Find potential friends:
      // - Not the current user
      // - Not already friends with the current user
      const potentialFriends = await User.find({
        _id: { $ne: userId, $nin: currentUserFriendIds },
        // Optionally, add more criteria here, e.g., active users, users in the same location, etc.
      }).select('profile.firstName profile.lastName profile.username profile.profilePictureUrl profile.interests'); // Select fields to return

      // Score potential friends based on mutual interests
      const scoredFriends = potentialFriends.map(potentialFriend => {
        let score = 0;
        const mutualInterests = (potentialFriend.profile.interests || []).filter(interest =>
          currentUserInterests.includes(interest)
        );
        score += mutualInterests.length * 10; // Add 10 points for each mutual interest

        // Add other scoring factors if needed (e.g., mutual friends, location proximity)

        return { user: potentialFriend, score };
      });

      // Sort by score in descending order
      scoredFriends.sort((a, b) => b.score - a.score);

      // Get the top N recommendations
      const recommendations = scoredFriends.slice(0, limit).map(sf => sf.user);

      return recommendations;
    } catch (error) {
      console.error('Error recommending friends:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  /**
   * Placeholder for a more advanced recommendation algorithm.
   * This could involve machine learning, collaborative filtering, etc.
   */
  static async getAdvancedRecommendations(userId, limit = 10) {
    // TODO: Implement more sophisticated recommendation logic
    // For now, it can call the basic one or return a dummy list
    return this.recommendFriends(userId, limit);
  }
}

module.exports = RecommendationService;
