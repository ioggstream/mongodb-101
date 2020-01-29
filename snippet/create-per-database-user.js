use test;
testRole = { "role": "readWrite", "db": "test"};
db.createUser({
  "user": "test",
  "pwd": "test", 
  roles: [ testRole ]
});

