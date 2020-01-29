# Connecting and Administering

  * Using the configuration file
  * Connecting
  * Authentication
  * Logging
  * Manage DB and Collections
  * Backup

---

# Configuration

Using /etc/mongod.conf

```
mongod -f /etc/mongod.conf
```

NOTE: Always comment log files!

----

# Exercise

- Add `--directoryperdb` option to
  /etc/mongod.conf and restart the server
  
- Check the logs and eventually fix the errors

---

# Connecting

By default you can connect to mongo without authentication via the mongo shell.
```
mongo [host/]dbname [-u username] [-p password] 
```

Check users and databases
```
show users;     /* empty */
show databases; /* two dbs */
admin  0.000GB
local  0.000GB
```

Get help
```
help;
```

----

# Hints

* mongo-shell includes a js engine
* every line ends with ";"
* only use double-quote
* loads the ~/.mongorc.js at startup

---

## db.auth()

 * off by default
 * per-database (Oracle style)
 * enabled at startup via the ```--auth``` argument or the [security.authorization](https://docs.mongodb.org/manual/reference/configuration-options/#security.authorization) /etc/mongod.conf parameter.
 * global users are created under the `admin` database.

----

Create a root user in the `admin` db.
```
use admin; 
user = {
  "user": "root",
  "pwd": "root",
  "roles": ["root"] /* root is a predefined role. */
};
db.createUser(user);
```

Exercise: try to create `root` without switching to `admin`.

----

If ```--auth``` is set:

  * you can first-login only on localhost
  * you *must* authenticate even to the current session.

```
db.auth(user["user"], user["pwd"]);
```

Exercise:
 - restart mongod with --auth
 - what happens if you do not authenticate?


----

## db.auth()

`root` creates per-database users

```
use test;
testRole = { "role": "readWrite", "db": "test"};
db.createUser({
  "user": "test",
  "pwd": "test", 
  roles: [ testRole ]
});
```

----

### db.getRoles()

A wide set of [roles are provided](https://docs.mongodb.org/manual/reference/built-in-roles/), including:

  * `{read, readWrite, userAdmin, dbAdmin}[AnyDatabase]`
  * `backup`, `restore`
  * `cluster{Admin, Manager, Monitor}`
  * `dbOwner`

```
show roles
```

---

## show logs

MongoDB logs on stdout|stderr by default.

Explicit a log file in truncate or append mode via [systemLog](https://docs.mongodb.com/manual/reference/configuration-options/#systemlog-options) parameters or

```
mongod --logpath mongod.log [--logappend]
```

Syslog via [systemLog.destination=syslog](https://docs.mongodb.org/manual/reference/configuration-options/#systemLog.destination) or

```
mongod --syslog
```

----

## show logs

Logs can be accessed via mongo-shell in the `local` database
like §MySQL `set LOG_OUTPUT='TABLE';`

```
> show logs;
global
startupWarnings
> show log global;
```

Or from
```
use local; 
db.startup_logs.find().pretty(); /* format output */

```

----

## use database

To create a database just use it and create a collection in it. 

```
use mydb_shorter_than_64_chars;
show dbs; /* empty until we create a collection */
db.createCollection("test", {/* further options */});
show dbs; /* tada! */
```

DB names are *somewhat* case INSENSITIVE
```
db.getSiblingDB('mylower').createCollection('foo');
db.getSiblingDB('mylower').getCollectionNames(); /* ['foo'] */
db.getSiblingDB('myLOWER').createCollection('foo'); /* error! */
db.getSiblingDB('myLOWER').getCollectionNames(); /* [] empty ;) */
```

----

## db.serverStatus()

Once retrieved server statistics,
```
> stat = db.serverStatus()
```

You can browse them in mongo-shell with <tab> completion.
```
> stat.<tab>

stat.version           stat.network       stat.uptime
stat.host              stat.ok            stat.storageEngine
stat.connections       stat.localTime     stat.opcounters   
stat.writeBacksQueued  stat.locks         stat.wiredTiger   
stat.extra_info        stat.mem           stat.pid          
stat.globalLock        stat.metrics       stat.process 
...

```

----

# db.serverStatus()
Show connections or ops
```
> stat.connections
{ "current" : 2, "available" : 838858, "totalCreated" : NumberLong(7) }

> stat.opcounters
{
        "insert" : 1001,
        "query" : 6,
        "update" : 1,
        "delete" : 0,
        "getmore" : 0,
        "command" : 258
}
```

---

## mongostat

A command to gather stats, § `mysqladmin stats`

```
# bind as root
mongostat INTERVAL  [-hhost] [-uroot] [-proot] [--authenticationDatabase admin]
insert query update delete getmore command % dirty % used flushes  vsize   res qr|qw ar|aw netIn netOut conn                      time
    *0    *0     *0     *0       0     1|0     0.0    0.0       0 250.0M 66.0M   0|0   0|0   79b    18k    2 2016-05-04T18:45:46+02:00
```

mongostat can `--discover` server topology or output in different format.
See [mongostat manual](http://docs.mongodb.org/manual/reference/program/mongostat/)

You can use mongotop too. 


----

## tools comparison

| Mongo | Mysql |
|-------|-------|
| .mongorc.js | .my.cnf  |
|mongoexport | mysqldump|
|mongoimport | mysql < file.sql |
|mongodump / mongorestore | mysqlbackup | 
|mongotop / mongostat    | mysqladmin |

Note: 3.2 [deprecated mongooplog](https://jira.mongodb.org/browse/DOCS-6458?focusedCommentId=1264935&page=com.atlassian.jira.plugin.system.issuetabpanels%3Acomment-tabpanel#comment-1264935)
in favor of using mongodump/restore with `oplog` options.

 
----

## tools comparison

| Mongo | MySQL |
|---|---|
|db.currentOp() | SHOW PROCESSLIST |
|db.setProfilingLevel(0) | set slow_query_log OFF |
|db.setProfilingLevel(1) | set slow_query_log ON |
|db.setProfilingLevel(1, slow_ms) | set long_query_time slow_sec (float) |
|db.setProfilingLevel(2) | set general_log ON | 

<!-- .element: style="font-size: 30px" -->

----

## tools comparison

Statistics are per-collection. A `SHOW TABLE STATUS` is achieved with

```
db.stats();                      /* database overview  */
stats = db.collection.stats();   /* detailed stats */
{
        "ns" : "test.testcol",
        "count" : 1000000,
        "size" : 51000000,
        "avgObjSize" : 51,
        "storageSize" : 21458944,
        "nindexes" : 2,
        "totalIndexSize" : 21626880,
        "indexSizes" : {
                "_id_" : 11776000,
                "a_1_b_1" : 9850880
        },
        "wiredTiger": {...}
}
```

<!-- .element: style="font-size: 20px" -->
