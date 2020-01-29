# MongoDB (for MySQL users).

---


# Strategy:

presenting mongo administrations respect to MySQL
MySQL like features are marked with §
Check http://docs.mongodb.org/manual/reference/sql-comparison/

---

Goals 

## Basic 

  * Install and use mongo
  * Mongo use-cases
  * Mongo vs MySQL entities and datadirs

----

## Developers

  * CRUD vs SQL
  * Planning schemas

----

## Administration

  * Replication
  * Sharding
  * Availability
  * Authentication

---

# Installation

```
echo > /etc/yum.repos.d/mongo-4.2.repo '
[mongodb-org-4.2]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/4.2/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.2.asc
'

yum -y install mongodb-org  # Use dnf on rhel8
```

----

## Exercise

Use `rpm` to list mongodb packages
and their content.


----

## mongod: the server executable

```
mongod --version
db version v4.2.1
git version: edf6d45851c0b9ee15548f0f847df141764a317e
OpenSSL version: OpenSSL 1.1.1 FIPS  11 Sep 2018
allocator: tcmalloc
modules: none
build environment:
    distmod: rhel80
    distarch: x86_64
    target_arch: x86_64
```

----

## SELinux
Check or tune the mongo port ...
```
semanage port -a -t mongod_port_t -p tcp 27017
```
...and datadir
```
ls -ldZ /var/lib/mongo/
drwxr-xr-x. 4 mongod mongod system_u:object_r:mongod_var_lib_t:s0 4096 13 apr 18.06 /var/lib/mongo/
```

----

## Start mongo*d*

Manually

```
mongod --dbpath /var/lib/mongo \
  --directoryperdb \
  --logpath $LOGFILE --logappend &
```

or via systemctl 

```bash
vi /etc/mongod.conf
systemctl enable mongod
systemctl start mongod
```

----

## Exercise

Use linux commands (eg `ls, ps, ss`) to:

* check the log file
* check that mongod is running
* how much memory is using?
* which TCP port?

----

# dbpath overview

Datafiles include:

  - process lock file
  - journal ~ innodb log file
  - WiredTiger ~ innodb, file-per-table

```
├── ...
├── mongod.lock
├── _mdb_catalog.wt
├── journal
│   ├── WiredTigerLog.0000000007
│   └── ...
├── sizeStorer.wt
├── storage.bson
├── WiredTiger
├── WiredTigerLAS.wt
├── WiredTiger.lock
├── WiredTiger.turtle
└── WiredTiger.wt
```

----

other files

```

|-- local
|   |-- collection-2-3254897655478956304.wt
|   `-- index-3-3254897655478956304.wt
|-- admin
|   |-- collection-0-3254897655478956304.wt
|   `-- index-1-3254897655478956304.wt
|-- config
|   |-- collection-4-3254897655478956304.wt
|   |-- index-5-3254897655478956304.wt
|   `-- index-6-3254897655478956304.wt
|-- diagnostic.data
|   |-- metrics.2019-11-28T07-41-15Z-00000
|   `-- metrics.interim
```

----

## Exercise: dbpath

* use `tree` to get the structure of your `mongo` directory.
* remove all files from `/var/lib/mongo` and
  recreate them without passing the `--directoryperdb`
  and get the directory structure again
* tell the differences between the two directory structures
  

----

## mongo shell

Connects and control `mongod`

```
mongo

MongoDB shell version v4.2.1
connecting to: mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("5815bff6-3820-4cc8-bc7b-34a2062e5e57") }
MongoDB server version: 4.2.1
Server has startup warnings: ...
...
> exit
```


---

# Lesson 1

  * Use Cases
  * Documents vs Records
  * HLA
  * Storage Engines


---


# Use cases

  * store documents of loosely related data
  * dynamic schema
  * store data in the same format as you want to retrieve it


---


# Documents

Basically nested dictionaries, handled with JSON syntax and managed in BSON.

BSON: binary json serialization standard. Fields order is not guaranteed. Max size: 16MB.

JSON *mandates* double-quote, mongo-shell:
  
  - accepts unquoted keys and single-quote
  - requires quotes around strings

**Test the following examples in `mongo` **

----

## JSON value (eg. field)

<img src="http://www.json.org/img/value.png" width="60%"/>

[img-json-value]: http://www.json.org/img/value.png

```
"A string"
1
ISODate("2014-01-01T00:00:00Z")
```

----

## JSON Arrays

![json-array][img-json-array]

```
["this", "is", 1, "array", 
 "of", "mixed", "types", ISODate() /*is now*/ ]
```

[img-json-array]: http://www.json.org/img/array.png
[img-json-string]: http://www.json.org/img/string.png

----

## JSON Objects

<img src="http://www.json.org/img/object.png" width="40%"/>

[img-json-object]: http://www.json.org/img/object.png

```
{ 
  "an": "object", 
  "with": { 
    "nested": "documents",
    "at various": {
       "levels": 3
    }
  },
  "and": [ 1, 2, 3, "arrays"],
  "andmore": ISODate("2014-01-01T00:00:00Z")
}
```

----

## Documents vs Records

database: database

```
show databases
```

collection: table

```
show collections
```

(json) document: record 

```
doc = {"_id": 1, "name": "jon"}
```

field: column

```
"name": "jon" 
```

----

## Documents vs Records

|record | document |
|--------|----------|
|fixed schema | hashtable |
|may have keys| _id is a compulsory primary key|
|PK can be auto-increment| auto-generated _ids are 12-byte incremental |
|PK is modifiable| _id is immutable |
|links with FK| links via embedding or reference |

----

document:

```javascript
{ 
  _id: ObjectId(...), /* _id can be a document too. */ 
  "username": "jon78"
  "books": [ {"bookName": "Learning Python"} ] 
}
```

record:

<div style="float: left; width: 40%">
users
<table>
<tr><td>id</td><td>username</td></tr>
<tr><td>1</td><td>jon78</td></tr>
</table>
 
</div>

<div style="float: right; width: 40%">
books
<table>
<tr><td>user_id</td><td>book_name</td></tr>
<tr><td>1</td><td>Learning Python</td></tr>
</table>

</div>



----

## Remember I

 * JSON keys are always strings, enclosed in double-quote. 
 * Basic types are: numbers, strings, booleans and null.
 * BSON adds further datatypes: RegExp, ISODate, ... which makes mongo items a superset of json.

----

### Exercise JSON

Which is the expected output of the following JSON objects?
 
- `o = {1: 1, "1": 2, "foo": "bar"}`
- `o = {foo: "bar"}`
- `o = {"foo": bar}`
- `o = {"foo": o}`

----

## Remember II

 * Mongo speaks BSON with drivers.
 * Be careful with +64bit floats.
 * Object have an incremental, unique _id which should not be used for sorting.
   Consider creating uniqueIndex on other fields

 
---
 
# Mongo | MySQL

  * less features, more performance
  * single-document only transactions [until 4.2][transactions]
  * no joins > data duplication, linking
  * implements caches and queues
  * configurable consistency levels
  * §Engine API, Multiple engines
  
  *No replication => No durability!*
  
[transactions]: https://docs.mongodb.com/manual/core/transactions/index.html

----

## Engines

*One engine per instance*

WiredTiger: default >= 3.2

  * file-per-table
  * journal with [LSN Log sequence number][mysql-lsn]
  * locking: document (concurrency++)
  * compression
  * internal buffer pool

[mysql-lsn]: https://dev.mysql.com/doc/dev/mysql-server/8.0.12/PAGE_INNODB_REDO_LOG.html

----

### MMap1
deprecated, default <=3.0

  * single tablespace made of datafiles
  * journal with lsn
  * locking: collection (concurrency--)
  * in-memory + journal + checkpoint
  * files managed by linux buffer/cache

----

### MMap1

* Memory mapped files.
* Heavily relies on Linux buffer/cache, unlimited memory usage.
* Modifications are committed in groups on the journal every 100ms(tunable).
```
{queries} --> Private View (RAM) --group-commit-->> journal (100ms) 
   --journal--> Shared View (RAM) --flush-->> Datafiles (60s)
```

----

### MMap1

* Datafiles are updated every 60s (tunable).
* Journal is cleaned up on graceful shutdown.

*No [durability][term-durable]: RPO > (100ms) tunable*

[term-durable]: https://docs.mongodb.com/manual/reference/glossary/#term-durable

----

### [WiredTiger](https://docs.mongodb.com/manual/core/wiredtiger/)
default >= 3.2

* implements a cache, like [innodb-buffer-pool]

```
--wiredTigerCacheSize $RAM/2 # default
```

* Journal:
 
  * traces every record modification and related changes to the indexes
  * 128k buffer, flushed periodically (50ms tunable)
  * snappy compressed
  * [mandatory for replicas since 4.0](https://docs.mongodb.com/manual/reference/program/mongod/#cmdoption-mongod-nojournal)

[innodb-buffer-pool]: https://dev.mysql.com/doc/refman/8.0/en/innodb-buffer-pool.html

----

### WiredTiger

* Checkpoint happens every 60s.
```
q --> Journal Buffer --flush--> Journal(snappy)
      WT Cache  --checkpoint--> datafiles
```
* Enable durability with `writeConcern: {j: true}` (more on that later).

*No durability if `{j: false}` : RPO > (128k | 50ms)*


----

## Others and 3rd party

* Memory: >=3.2 non durable, fast engine.
* [RocksDB]: flash-optimized engine by Facebook
* HDFS: Hadoop Filesystem backed.

[RocksDB]: https://github.com/facebook/rocksdb/

---

## Replication teaser

 * shared nothing
 * every change is logged on the opLog collection (rs.opLog)
 * opLog is streamed to secondaries
 * opLog has a fixed size created at startup ```--opLogSize```
 * compulsory to achieve durability

----

## Replication shots

* Enabled at startup labeling each node with a replicaSet 
```
--replSet myreplica
```
* Configured listing all members
```
rs.initiate({
  "_id": "myreplica", /* same as --replSet */
  "version": 0, /* increasing at every change */
  "members": [
    { "_id": 0, "host": "server-1"}, 
    { "_id": 1, "host": "server-2"}, 
    { "_id": 2, "host": "server-3", "arbiterOnly": true} /* quorum node */
  ]
})
```
* Secondaries loads initial data automatically
