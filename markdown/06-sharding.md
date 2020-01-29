# Sharding

Scale database with sharding, then replicate each shard to provide HA.

[shard-logo](https://docs.mongodb.com/manual/_images/sharded-cluster-production-architecture.bakedsvg.svg)

Shard splits the database in shards using a shard key. Each shard is made of chunks. 
When a chunk is too big, mongo splits it in 2. Chunks can be moved between shards.

Each database stores unsharded collections in a primary shard.

Good keys splits the database in equally-sized shards. Each shard should grow equally in time. Pick fields with:

  - a great cardinality (many possible values);
  - not monotonical (eg. dates, sequences);
  - used by queries;

Remember:

If queries do not include the shard key or the prefix of a compound shard key, mongos performs a broadcast operation, 
querying all shards in the sharded cluster. These scatter/gather queries can be long running operations.



Consider:

  - hash functions reduce cardinality;
  - hash functions may shuffle monotonical sequences;
  - hash functions may trouble range-queries;
  - read locality between queries: a resultset should span one shard.

A sharded db is made of:

Mongos: processes routing queries to the right shard
Configs: servers with shard infos, at max 3 servers (eg. deploying on 4+ DC means there are DCs without Configs)
Shards: mongod with replicated shards.

Applications issue queries to mongos;
Mongos uses Configs to route the request to the right shard;
Shards serve request and exchange their status with Configs;


# Shard commands


List databases, eventually sharded if `{partitioned: true}`

	use config
	db.databases.find()

Sharding status 

	sh.status()


