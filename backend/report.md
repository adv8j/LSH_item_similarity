```
❯ grep -E "description\"\: \[\]"  meta_Appliances.json | wc -l

2306
❯ wc -l meta_Appliances.json
30445 meta_Appliances.json
```


- remove punctuation or not (or replace it with a simple ".")?
- how to rank ground truth(taking also_view and also_buy - how to rank within them?)?
- some ASINs in also_buy/also_view are NOT present in dataset.

          