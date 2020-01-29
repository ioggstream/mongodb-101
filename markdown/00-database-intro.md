# Database Intro



---


## Goal

  - What is a database
  - ACID and non-ACID database
  - The CAP Theorem*
  - Memory & Disk usage

---


# What is a database



----


## What is a database

  - Adding data: a single-connection in-memory database. Key-Value stores. Memory fragmentation.

  - Durability: making data persistent. Checkpoints. Memory vs Storage speed. I/O bound.

  - Buffering: serving requests during checkpoints. Paging mechanism.

  - Performance impacts of durability.


----

## What is a database

  - Isolation: serving multiple connections. Synchronization. CPU bound.

  - Reading data: finding data. Indexes. Indexes are not a free ride.

  - Caching: Memory vs Storage speed. Index memory. Memory is not $\infty$. Fragmentation.

  - Adding a language layer. Overhead of SQL. Optimization. Document databases.



---

# ACID and NON-ACID databases

----


## ACID and NON-ACID databases

  - Consistency. Repeatable reads.

  - Atomicity: all or nothing.

  - Transactions. Managing multiple queries. Rolling back. Transaction logs.



----


## ACID and NON-ACID databases

Concurrency issues:

  - dirty read: a non rolled-back entry is used by another transaction
  - unrepeatable read: reading twice a single entry in a transaction gives different results (entry committed by another transaction)
  - phantom read: a special case of unrepeatable read, with multiple entries. Old entries are preserved, newly committed entries are shown.

See wikipedia [Isolation_(database_systems)](https://en.wikipedia.org/wiki/Isolation_(database_systems))



---

# CAP Theorem
 Partitioning: Synchronization reloaded.

You cannot have the same level of:

 - Consistency
 - Availability
 - Partition

Instead you have to favor something respect to the other.

See [the wikipedia article](https://en.wikipedia.org/wiki/CAP_theorem)



----


## CAP Theorem Reloaded

You can pay to get faster

  - network
  - cpu
  - storage

Price is the 4th dimension.


