const users = [];

exports.fetchUsers = async () => {
  return users;
};

exports.addUser = async (data) => {
  const newUser = { id: Date.now(), ...data };
  users.push(newUser);
  return newUser;
};
