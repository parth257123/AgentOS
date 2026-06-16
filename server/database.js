// Simulated Database
const db = {
  users: [
    {
      id: 'usr_123',
      name: 'Demo User',
      email: 'demo@agentos.io',
      walletBalance: 5.00000 // Start with $5.00
    }
  ],
  
  getUser(id) {
    return this.users.find(u => u.id === id);
  },
  
  deductCredits(id, amount) {
    const user = this.getUser(id);
    if (!user) return false;
    
    if (user.walletBalance < amount) {
      return false; // Insufficient funds
    }
    
    user.walletBalance -= amount;
    return user.walletBalance;
  }
};

module.exports = db;
