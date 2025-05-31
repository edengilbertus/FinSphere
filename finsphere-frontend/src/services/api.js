const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
    this.maxRetries = 1; // Number of retries for failed requests
  }

  // Set authorization token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  // Get authorization headers
  getHeaders(includeContentType = true) {
    const headers = {};
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic API call method with retry logic
  async apiCall(endpoint, options = {}, retryCount = 0) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(!(options.body instanceof FormData)),
      ...options,
    };

    try {
      console.log(`📡 API Call: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      // Handle token expiration
      if (response.status === 401 && this.token && retryCount === 0) {
        console.log('Token may have expired, attempting to refresh...');
        // You could implement token refresh logic here
        // For now, we'll just retry once
        return this.apiCall(endpoint, options, retryCount + 1);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        console.error(`❌ API Error: ${response.status} - ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Some endpoints might not return JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
      return data;
    } catch (error) {
      // Retry logic for network errors
      if (error.message === 'Failed to fetch' && retryCount < this.maxRetries) {
        console.log(`Network error, retrying (${retryCount + 1}/${this.maxRetries})...`);
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(this.apiCall(endpoint, options, retryCount + 1));
          }, 1000); // Wait 1 second before retrying
        });
      }
      
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(email, password) {
    return this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    const result = await this.apiCall('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
    return result;
  }

  // User endpoints
  async getProfile() {
    return this.apiCall('/users/me');
  }

  async updateProfile(profileData) {
    return this.apiCall('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getFriendRecommendations(limit = 10) {
    return this.apiCall(`/users/me/recommendations?limit=${limit}`);
  }

  // Posts endpoints
  async getPosts(page = 1, limit = 10) {
    return this.apiCall(`/feed?page=${page}&limit=${limit}`);
  }

  async createPost(postData) {
    return this.apiCall('/feed', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  // Messages and Chat endpoints
  async getConversations() {
    return this.apiCall('/messages');
  }

  async getConversation(userId, page = 1, limit = 50) {
    return this.apiCall(`/messages/${userId}?page=${page}&limit=${limit}`);
  }

  async sendMessage(recipientId, content, messageType = 'text', attachmentUrl = null) {
    return this.apiCall('/messages', {
      method: 'POST',
      body: JSON.stringify({
        recipient: recipientId,
        content,
        messageType,
        attachmentUrl,
      }),
    });
  }

  async markMessageAsRead(messageId) {
    return this.apiCall(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async markConversationAsRead(userId) {
    return this.apiCall(`/messages/${userId}/read-all`, {
      method: 'PUT',
    });
  }

  // Savings Goals endpoints
  async getSavingsGoals() {
    return this.apiCall('/savings-goals');
  }

  async createSavingsGoal(goalData) {
    return this.apiCall('/savings-goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  async updateSavingsGoal(goalId, goalData) {
    return this.apiCall(`/savings-goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    });
  }

  // Upload endpoints
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.apiCall('/upload/avatar', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadCoverPhoto(file) {
    const formData = new FormData();
    formData.append('cover', file);
    
    return this.apiCall('/upload/cover', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadPostImages(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    return this.apiCall('/upload/post-images', {
      method: 'POST',
      body: formData,
    });
  }

  // Follow endpoints
  async followUser(userId) {
    return this.apiCall(`/follow/${userId}`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId) {
    return this.apiCall(`/follow/${userId}`, {
      method: 'DELETE',
    });
  }

  async getFollowStats(userId) {
    return this.apiCall(`/follow/${userId}`);
  }

  // Like a post
  async likePost(postId) {
    return this.apiCall(`/feed/${postId}/like`, {
      method: 'POST',
    });
  }

  // Comment on a post
  async commentOnPost(postId, text) {
    return this.apiCall(`/feed/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }
}

export default new ApiService();
