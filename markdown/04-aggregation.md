# Aggregation

The aggregation framework is more similar to sql than just CRUD.

```
db.collection.aggregate([
{$match: where },
{$project: select },
{$group: group_by},
{$unwind: join}
{$sort: order}, {}
], options)
```
It's based on the aggregation pipeline, made of the following stages:

* match
* project
* group, unwind, sort : RAM GREEDY
* skip / limit

----

## Pipeline options 
Options helps managing pipeline performance


----

## Aggregation performance

Being more similar to SQL can be GREEDY.

 - RAM usage is limited to 100M (per connection/pipeline/global?)
 - returned document is limited to 16MB
 - covered queries only from 3.2+
``` 
options = {  
  explain: <boolean>,
  allowDiskUse: <boolean>,      /* bypass 100MB RAM limits */
  cursor: <document>,           /* bypass BSON 16MB limits */
  bypassDocumentValidation: <boolean>,
  readConcern: <document>
}
```

----

## Aggregation and Scaling

group_by | sort are managed by the first shard, which becomes a bottleneck.

in replicaSet use readConcern to read:

 - forcefully o preferibly on primary, secondary or nearest
 

---

## Example: aggregation by date

Reuse code writing json-formatted variables:
```
// $dateToString == stftime()
date_to_string = {"$dateToString": {"format": "%Y%m", "date": "$timestamp"}} 
```
Now run the query
```
db.shopping.aggregate( 
  {$group: { _id: date_to_string, count: {$sum: 1}}},
  {$sort: {_id:1}}
);
> result
{ "_id" : "201607", "count" : 4128 }
{ "_id" : "201608", "count" : 5222 }
{ "_id" : "201609", "count" : 7230 }
{ "_id" : "201610", "count" : 3203 }
...

``` 
