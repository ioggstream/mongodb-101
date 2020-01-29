use admin; 
user = {
  "user": "root",
  "pwd": "root",
  "roles": ["root"] /* root is a predefined role. */
};
db.createUser(user);

