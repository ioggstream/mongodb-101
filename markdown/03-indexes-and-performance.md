## Indexes and Performance

 * Index logic are similar to MySQL
 * Scalability with Sharding
 * availability with Replication
 * No Joins make it easier
 * Drivers are replication-aware
 * Move logic to application
 

---

## Indexes

* Indexes recap
* What to index
* Index types and limitations
* Explain

----

Querying an index from

[mongodb official docs](https://docs.mongodb.com/manual/indexes/)

![Index Example](https://docs.mongodb.com/manual/_images/index-for-sort.bakedsvg.svg)
----

### Indexes

* Consume RAM, I/O(write), CPU
* Save I/O(read), I/O(update), CPU
* Index fields with great cardinality
* Remove unused indexes
* Use <= [64 indexes per collection](https://docs.mongodb.com/manual/reference/limits/#Number-of-Indexes-per-Collection)
  on 4.2. Lower limits may apply on older versions.

[Index limitations](https://docs.mongodb.com/manual/reference/limits/#indexes)

----

## Simple and multikey indexes.

Indexing `n` and `tag` on the following data:
```
data = [
  {_id:1, n: "jon", tag: ["php", "perl", "python"]}, 
  {_id:2, n: "mark"}, tag: ["c++", "c", "php"] }
  {_id:3, "n": "bill", tag: ["c#", "c"]}
  ]
```
Results in *two* more tables to be maintained:
```

|Index (n)|      |  Index(tag)  | /* A multikey index! */
|--- |--- |      |---   |---    |
|jon |1   |      |c     | 2,3   | /* bill & mark */
|mark|2   |      |c++   | 2     |
|bill|3   |      |c#    | 3     |
                 |perl  | 1     |
                 |php   | 1, 2  | /* jon & mark */
                 |python| 1     |

```
Note: Multikey index are expensive and *don't cover* queries!

----

### Index usage

Retrieving data only from indexes is fast.

Sorting happens after retrieval:

  - requires RAM;
  - is slow (N log N)
  
Indexes are saved orderly: good indexing saves ordering.

----

### Indexes priority

Creating indexes consider the sorting effort.

# E > S > R

Exact - Sort - Range

---

### Exercise: creating and searching data

In this exercise session we will:

- install mgodatagen, a tool for adding mock data 
  to the database
- populate some collections
- export and reimport data using
  mongo{dump,export} and mongo{restore,import}
- check mongo performance using `mongostat`

---

Install [mgodatagen](https://github.com/feliixx/mgodatagen/tree/master/datagen/testdata)


```
wget https://github.com/feliixx/mgodatagen/releases/download/0.7.5/mgodatagen_linux_x86_64.tar.gz
tar xf mgodatagen_linux_x86_64.tar.gz
./mgodatagen --help
```

Then get the configuration file and read it
```
wget https://raw.githubusercontent.com/feliixx/mgodatagen/master/datagen/testdata/big.json
less big.json
```

----

Create a collection with 1000 documents

```
vi big.json  #       "count": 1000000, - 1000
./mgodatagen -f big.json
```

Check the collection. Which commands did you use?

----

Edit `big.json` and create a collection
of  1'000'000 documents.

```
./mgodatagen -f big.json
```

How long did it take?

----

Export the created collection with `mongodump`
and check the resulting `dump` directory

```
mongodump
ls -lRh dump/
```

----

Measure the restore time using

```bash
mongorestore dump/ -v --drop
```

Then try with different `writeconcern` 

```
    --writeConcern '{ fsync: true, j: true}' \
    -j4 --numInsertionWorkersPerCollection=4
```

----
### Exercise: performance

Repeat the above exercise measuring statistics
in another two terminals:
 - run `mongostat`
 - install and run `dstat`

Now create a collection of 1'000'000 entries with


Monitor the mongostat and dstat output.

----

Now check database and collection stats.

Hint: check the commands on the previous
lessons or on the official documentation.

---

## Index types

* default (works even for arrays, named multikey)
```
db.coll.createIndex({"sn": 1});
```
* compound (not commutative!)
```
db.coll.createIndex({ "mobile": 1, "callTime": 1});
/* as in MySQL, is different from */
db.coll.createIndex({ "callTime": 1, "mobile": 1});
```
* hashed, only for exact matches
```
db.coll.createIndex({"account": "hashed"});
```

----

## Index types with properties

* unique
```
db.coll.createIndex({"mobile": 1}, {"unique": true});
```
* TTL - entries are deleted after TTL (via best effort internal scheduler)
```
db.coll.createIndex({"ts": 1}, {"expiresAfterSeconds": 60});
```
* sparse (indexing only present fields, see [caveats](https://docs.mongodb.com/manual/core/index-sparse/?_ga=1.230476764.1506249213.1442582596#sparse-index-incomplete-results))
```
db.coll.createIndex({"bought": 1}, {"sparse": true}); /*only fields where {bought: {$exists: 1}} */
```
* geospatial index (to find "near" points)

----

## Index creation

- Index creation is slow and blocking.

- Create the index in background is:

  * non-blocking on primary
  * blocking on secondaries
  * significantly slower
  * less optimized

```
db.collection.createIndex({a: 1}, {"background": true});
```

* In 3.0+ ensureIndex() is deprecated.

----

## Index Features and Limitations

* MK indexes are GREEDY: you can have only one per compound index.
* Hash indexes can't be UNIQUE: you need to create a separate one to enforce uniqueness.

----

* An index COVERS a query when:
  - contains all the search fields;
  - contains all projected fields (including _id);
  - fields are not array aka no MK like  `createIndex({"tag": 1})`
  - sub-documents are not involved  ` createIndex({"user.account": 1})`


---

## Explain

You can explain queries via:

```
explainableCollection = db.collection.explain(modeString);
explainableCursor = explainableCollection.find(query);
```
or
```
explainableCursor = cursor.explain(modeString);
```

| alias | mode | action | 
| --- | --- | --- | 
| 0 | queryParser | don't execute, just hints |
| - | executionStats | execute and gather stats |
| 1 | allPlansExecution | executionStats from all possibile plans |


----

## Explain and deleted

You can explain `delete()` and `update()`.

Those are not executed even in executionStats and allPlansExecution.


----

## Explain output

```
ret = db.coll.find({uid:0}, {uid:1, _id:0}).
        explain(1).next();

ret.executionStats
{ ...
    "executionSuccess" : true,
    "nReturned" : 4,                /* Entries nReturned*/
    "executionTimeMillis" : 0,
    "totalKeysExamined" : 4,        /* Keys retrieved from the Index */
    "totalDocsExamined" : 0,        /* Documents retrieved from disk/cache */
    "executionStages" : {           /* Insights about processing */
        ...
    }
    ...
}
```

----

## Explain output

Execution stages include:

- PROJECTION: when db.find(query, project != {})
- COLLSCAN: full table scan
- FETCH: selected entries are retrieved from tablespace
- IXSCAN: entries retrieved from index 
- LIMIT: result is filtered with limit
- SORT_KEY_GENERATOR: entries are sorted in RAM

----

## Explain output

- Stages can be nested (Eg. if the FETCH uses the IXSCAN result).

- A query is covered by an index if:

  * everything has been retrieved from the index (totalDocsExamined = 0)
  * an IXSCAN stage is not a descendant of a FETCH stage 

eg.
```
for (i = ret.executionStats.executionStages; 
     i != undefined; 
     i = i.inputStage /* traverse inputStage */
) {
    print (i.stage);
}

```

----

## Stage examples

1- COLLSCAN

2- FETCH < IXSCAN

3- LIMIT < IXSCAN

4- SORT < FETCH < IXSCAN


----

## Index hints

* Anchored regexp are faster

```
db.coll.find({username: /^iogg/ }); /* don't examine the whole strings. */
```

* You can `hint("index_name")` but beware of sparse indexes: they may return limited results.

----

## Query plans

Mongo caches query plans and tries to reuse them

(https://docs.mongodb.com/manual/_images/query-planner-diagram.png)





