
const userService = require("../services/generateService");
exports.generate = async (req, res) => {
  const response = userService.fetchUsers()
  res.json(response).status(200);
};


