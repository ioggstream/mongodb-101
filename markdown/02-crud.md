## CRUD

Manage entries with mongo-shell

* create
* retrieve
* update
* delete

The ```db``` object represents the current database.

```
use mydb;
// or
db = db.getSiblingDB("mydb");
print("The current database is", db); 
```

---

## db.insert() 

You can insert one or multiple entries.

```
db.collection.insert(
   <document or array of documents>,
   {
     writeConcern: <document>,
     ordered: <boolean>
   }
)
```

*Ordered inserts* preserve the array sequence and stop at first error.

writeConcern specifies the number of expected acks from replicaSet members before the insert is successful. 


----

## db.insert()

Insert an entry without specifying an _id

```
db.c1.insert({ /* auto-generate, incremental _id */
  "uid": 1,
  "account": { "n": "Joe", "sn": "Black"},
});
```

Explicit id and writeConcern.
```
db.c1.insert({ 
  "_id": "robipolli@gmail.com",
  "uid": 2,
  "account": { "n": "Rob", "sn": "Black"},
}, { 
    "writeConcern": {"j": true}
}); /* Ensure the entry is persisted on logs; */
```

----

Multiple unordered insert 
 
```
items = [
    {_id: 1}, 
    {_id: 1}, /* This is a keyerror */ 
    {_id: 3}
    ];
db.c1.insert(items, { 
    writeConcern: {"w": 2}, /* If replicaset, ensure entry written on 2 nodes. */
    ordered: false
});
```

----

Exercise

Find relevant log files about inserting and creating collections.

---
## db.find()

Find retrieve entries per similarity and *returns a cursor*.

```
db.collection.find(
  { /* where */
    "key1": "case-sensitive, exact match", 
    "another": /regexp/modifiers },  
  { /* select */
    "key1": 1,
    "another": 1
  })
```

----

Use `var` to avoid consuming the curson in mongo-shell

```
var cur = db.c1.find();
/* consume the cursonr */
cur.forEach(print);
```

To return the first matching entry

```
var cur = db.c1.find(where);
entry = cur.next();           /* use cursor.next() or ..*/
entry = db.c1.findOne(where);
```

----

## find() and SQL

* no joins;
* use js code to get references between collections

```
/*Get book authors */
var cur = db.books.find({_id: {$gt: 1000}});
cur.forEach(function(item){
  author = db.authors.findOne({_id: item.author_id});
  print (author.name, author.sn, item.title);
});
```

----

## find() and SQL

* group-by implemented via db.aggregate()
* reference different dbs with

```
user_db = db.getSiblingDB('user');
library_db = db.getSiblingDB('library');
user_db.users.find().forEach(
  function(u){
    print(u, library_db.lends.count({"user": u._id}));
  });
```

----

## db.cursor

On a cursor you can:

  * sort, skip, limit: returning cursors
  * count: returning items

You can "pipeline" cursor methods.

```
cursor.sort({
  "key1": -1,   /* descending by key1, */
  "another": 1  /* then ascending by another */
  })  
.skip(int)
.limit(int)
.count();

```

----

## db.distinct() & db.count()

* distinct() implemented outside find(). Supports only ONE key. 

```
db.collection.distinct(
 keyString,
 <where>);
```

* complex distinct can be implemented via db.aggregate()

* db.count() and db.find.count()

```
db.find(where).count(); 
/* equals */
db.count(where);
```

----

## insert() & find()

```
db.c1.insert([
    {"u": "joe", "items": 1},
    {"u": "frank", "items": 1}
    {"u": "bill", "items": 2},
    ]);
expression = {items: 1};
db.c1.find(expression).count(); /* 2 */
```

----

## find() in arrays

Find in arrays using:

  * `$in`, `$all`

```
db.c1.insert([
    {t:[0, 1, 2]},
    {t:[2, 4, 6]},
    {t:[3, 6, 9]}
    ]);
db.c1.find({t: {$in: [2,3]}}).count();  /* 3 */
db.c1.find({t: {$all: [2,6]}}).count(); /* 1 */
```

----

# Exercises

Get a collection from the web

```
wget https://raw.githubusercontent.com/ozlerhakan/mongodb-json-files/master/datasets/countries-small.json
```

And import it in mongo.

```
mongoimport countries-small.json
```

- what do `-c` and `-d` parameter do?

----

# Exercise

find() in the "countries-small" collection:

- all the capitals
- the docs where {"capital": ""}
- the docs [without](https://docs.mongodb.com/manual/reference/operator/query/exists/) a `capital` field

---

## update() replaces a whole entry!

Use $set to edit entry fields.

```
db.c1.update(
  /*where*/   { "u": "joe"}, 
  /*replace*/ { "items": 10}, 
  /*upsert*/  false,
  /*multi*/   false
); /* Beware: FTS! */

db.find({"u": "joe"}); /* no results! */  
```

----

Upsert and multi can be passed as options object

```
db.c1.update(
  {_id: {$gt: 100}}, 
  {$set: {"new": true}},
  {multi: true, upsert: false} /* options as object */
);
  ```
----

## update modifiers

Use:
``` 
* $set, $unset, 
* $inc, $mul, $max, $min
* $rename, $currentDate
* $push[All], $pop[All], $addToSet
```

```
db.c1.update({"items": 10},
  { 
    "$set": {"u": "joe"}, /*restore joe */
    "$push": {"itemList": "Android"} /* populate a new array field */
    "$inc": {"count": 1} /* and an incremental counter */
  }
)
```

----

## update array fields - 2 

Use dot-notation to specify array indexes.

```js
item = {
    _id: 1, 
    "lang": ["go", "c", "php"]
};      /*   0     1    2^^^  */
db.c1.insert(item);

db.c1.update(
   item,
  {$set: {"lang.2": "python" }} /* replaces "php" */
  );
```

----

Or dot-$ to modify *the one, previously selected* array item.
```
item = {"lang": ["go", "c", "php"]}};

db.c1.update(
  {"lang": "c"}, /* the matching item is stored in $ */
  {$set:         /* just modifies the first occurrence */
    { "lang.$": "C" }
  } 
  );
```

----

## update with $currentDate

Set the current timestamp, simple way:

```
db.c1.update({}, 
  {$currentDate: {"ts": true} }) /* Simple */
```

Or with custom format
```
dateFormat = {"$type": "timestamp"};
db.c1.update({}, 
  {$currentDate: {ts: dateFormat } },
  {multi: true, upsert: false} /* options as object */
);

```

----

## `save()` 

Upserts an entry:

  - if _id matches, *replaces* the whole entry;
  - else creates a new one
  
Beware of save(), you can lose data!

```
item = db.c1.findOne({_id: 1});

db.c1.update({_id: 1}, {
  $currentDate: {time: true}, 
  $set: {"head": "Black"}
});
item['name'] = "jon";
db.c1.save(item); /* I lost my "head" */
```

Consider using etags.

----

## ```findAndModify()``` - queues

Use [db.findAndModify()](https://docs.mongodb.com/manual/reference/method/db.collection.findAndModify/)
to implement a queue


```
/* Get unprocessed entries */
ret = db.queue.findAndModify({
  query: {"status": "unprocessed"},  /* the where clause */
  sort:  {"ts": -1},                 /* a LIFO queue */
  update: {$set: {"status": "processing"}},    /* what to change */
  new: false /* true: returns the modified entry, default:false */
});
assert(ret.status == "unprocessed");
```

A simple processor can just move the item
```
/* Process */
delete ret.status;
ret.ts = ISODate()
db.stored.insert(ret);
```


---

## remove

Remove all matching entries.
  
```
db.queue.remove(
  {"status": "processing"}, 
  {justOne: true} /* Limit removed entries */
  );
WriteResult({ "nRemoved" : 1 });
```

Beware: an empty filter removes all entries.
  
```
db.queue.remove({}) /* DELETE FROM queue; */
WriteResult({ "nRemoved" : 5 })
```

----

Like `DELETE` in MySQL, `db.remove()` does not:

  * drop index and metadata;
  * free disc space.

Use `db.queue.drop()` or `db.dropDatabase()` to free disc space.
  

---









