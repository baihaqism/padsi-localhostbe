const roles = {
    admin: {
      permissions: ['dashboard', 'customers', 'products', 'transactions'],
    },
    user: {
      permissions: ['dashboard', 'customers'],
    },
    guest: {
      permissions: [],
    },
  };
  
  export default roles;