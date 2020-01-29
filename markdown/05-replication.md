# Replication

* primary - secondary
* statement based
* oplog (§binlog) in a capped collection
* primary is elected automatically
* secondaries initialize automatically

Images from mongodb.com official docs.
(whiteboard lesson)
---

## Replication topology

* only primary accepts writes
* all nodes are connected via unicast

----

Replication steps 

- [Initial Sync](https://docs.mongodb.com/manual/core/replica-set-sync/#initial-sync)
  copy data from other nodes

- Replication: copy the oplog and apply it locally


![](https://docs.mongodb.com/manual/_images/replica-set-read-write-operations-primary.bakedsvg.svg)
<!-- .element: style="width: 50%" -->

----

During Initial Sync:
 
 - all data but `local` database is copied;
 - all indexes are built;
 - oplogs are copied too.
 
Intital Sync is a long and computationally intensive process
for both the new node and the peers.

----

## Members

* member types are
    - standard: data, voting, clients
    - hidden:   data, voting, no-clients
    - non-voting: data, no-voting, clients
    - arbiter: no-data, voting, no-clients
* max 7 voting members
* members can be tagged via
  [tags](https://docs.mongodb.com/manual/tutorial/configure-replica-set-tag-sets/#replica-set-configuration-tag-sets)

----

## Managing failover

- do not recover failed nodes
- instead resyncing nodes


---

## Initialization

Run a replica set store node with

```
mongod --replSet rs0 \       # replica set name
        --oplogSize 200   # how big is the oplog
```

----

Create a JSON document containing the configuration

```
rs_config = {
 "_id": "rs0", // The same as --replSet
 "version": 1,
 "members": [
    { "_id": 0, "host": "replica_rs_1" },
    { "_id": 1, "host": "replica_rs_2" },
    { "_id": 2, "host": "replica_rs_3" }
 ]
}
```

----

We can add `tags` and `arbiter` nodes.

```
rs_config = {
 "_id": "rs0", // The same as --replSet
 "version": 1,
 "members": [
    { "_id": 0, "host": "replica_rs_1", "tags": {"dc": "rm", "disk": "ssd" }},
    { "_id": 1, "host": "replica_rs_2", "tags": {"dc": "mi"}},
    { "_id": 2, "host": "replica_rs_3", "arbiterOnly": true}
 ]
}
```

----

Then create a replica configuration and initialize nodes.

```
rs.initialize(rs_config);
full_config = rs.config(); /* or its alias rs.conf()*/
rs.status(); /* health status */
```

----

Exercise: create a replica set

- run 3 mongodb instances from your environment
- create a replica-set configuration document using the minimal example
   in the previous slide
- check `rs.status()` before initialization
- use `rs.initalize()` to initialize the replica
- check `rs.status()` after initialization

----

Exercise: create a collection

- connect to the `PRIMARY`
- create the `foo.c` collection and insert some documents in it
- connect to another node and ensure it's there

Q: did it work? what happened? why?
 
----

Reading from secondaries is not safe.

If you accept the risks, you can use `rs.slaveOk()`

----

Exercise: stepdown a node

This command makes a SECONDARY out of a PRIMARY
```
> rs.stepdown() 
```

To ensure the node is not accidentally re-elected
for a while, use
```
> rs.stepdown(500)  // at least 500 seconds of SECONDARY
```

---

## Replication performance

Use mgodatagen to measure replication
performance on collections of different sizes.

Use different writeconcerns

---

## OpLogs

You can read the oplogs

```
use local
db.oplog.rs.find()
```

Get their size

```
db.oplog.rs.stats().maxSize
```

----

Grow them in megabytes (minimum 1000 aka 1GB)

```
size_MB = 2000
db.adminCommand({replSetResizeOplog: 1, size: size_MB})
```

Or compact them
```
db.runCommand({ "compact" : "oplog.rs" } )
```
Note: you can compact oplogs only on SECONDARY nodes 
and provided you have enough [privileges](https://docs.mongodb.com/manual/reference/command/compact/#compact-authentication)

----

Exercise: adding a new node

- create a new mongodb server
- connect to the primary
- update the configuration adding a new node
- reconfigure the replicaset
- repeat the previous exercises
- check logs for `INITSYNC`

----

Exercise: fail a node

In this exercise we will fail a node like
the following.

- connect to rs0_2 bash shell
- remove the `/data/db` directory

The node will shut down immediately

----

Exercise: recover a node

Re-run the previous node and check
what is happening.

Check log files and look what happens

``
grep -C20 INITSYNC mongodb.log
```


---

## Election

All voting nodes are connected: n(n+1)/2 streams!

The quorum is given by 50% + 1 nodes. A missing quorum puts the cluster in READ-ONLY.

During a failover, the cluster is READ-ONLY.

----

A failover is triggered:

  - RESIGN: when a primary resigns `rs.stepDown()`, this happens only if a suitable new master exists;
  - GOLPE: when a node with a greater priority steps in;
  - DEFEAT: when a primary loses its majority (eg. failure or network partition)
  
