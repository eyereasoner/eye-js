window.BENCHMARK_DATA = {
  "lastUpdate": 1683464479256,
  "repoUrl": "https://github.com/eyereasoner/eye-js",
  "entries": {
    "EYE JS Benchmark": [
      {
        "commit": {
          "author": {
            "email": "63333554+jeswr@users.noreply.github.com",
            "name": "Jesse Wright",
            "username": "jeswr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "031429d2ea5f4e58d750b4fe8f2d9da0afbf5046",
          "message": "chore: push performance results to pages (#301)",
          "timestamp": "2023-05-07T11:40:57Z",
          "tree_id": "5750af40c8d14accc8aef4129990b515fedfc5b0",
          "url": "https://github.com/eyereasoner/eye-js/commit/031429d2ea5f4e58d750b4fe8f2d9da0afbf5046"
        },
        "date": 1683459995536,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "Initialise SWIPL with EYE image",
            "value": 9.2,
            "range": "±13.62%",
            "unit": "ops/sec",
            "extra": "47 samples"
          },
          {
            "name": "Run socrates query",
            "value": 8.55,
            "range": "±11.75%",
            "unit": "ops/sec",
            "extra": "43 samples"
          },
          {
            "name": "Load data into a module",
            "value": 120465,
            "range": "±1.19%",
            "unit": "ops/sec",
            "extra": "84 samples"
          },
          {
            "name": "Load query into a module",
            "value": 137433,
            "range": "±1.37%",
            "unit": "ops/sec",
            "extra": "84 samples"
          },
          {
            "name": "Executing the socrates query",
            "value": 85.24,
            "range": "±15.98%",
            "unit": "ops/sec",
            "extra": "27 samples"
          },
          {
            "name": "Run deep taxonomy benchmark [10]",
            "value": 5.46,
            "range": "±10.63%",
            "unit": "ops/sec",
            "extra": "30 samples"
          },
          {
            "name": "Run deep taxonomy benchmark [50]",
            "value": 0.3,
            "range": "±4.06%",
            "unit": "ops/sec",
            "extra": "6 samples"
          },
          {
            "name": "Run deep taxonomy benchmark [100]",
            "value": 0.05,
            "range": "±3.31%",
            "unit": "ops/sec",
            "extra": "5 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "63333554+jeswr@users.noreply.github.com",
            "name": "Jesse Wright",
            "username": "jeswr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3dc72f7979b5221ef2988241d660336b5fabbe89",
          "message": "chore: add bundle badge (#302)",
          "timestamp": "2023-05-07T12:55:56Z",
          "tree_id": "ce1547ece9f0fe8542b68ea7edc0d7800d1299bd",
          "url": "https://github.com/eyereasoner/eye-js/commit/3dc72f7979b5221ef2988241d660336b5fabbe89"
        },
        "date": 1683464464498,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "Initialise SWIPL with EYE image",
            "value": 8.34,
            "range": "±12.89%",
            "unit": "ops/sec",
            "extra": "43 samples"
          },
          {
            "name": "Run socrates query",
            "value": 8.04,
            "range": "±11.69%",
            "unit": "ops/sec",
            "extra": "42 samples"
          },
          {
            "name": "Load data into a module",
            "value": 109301,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "85 samples"
          },
          {
            "name": "Load query into a module",
            "value": 126161,
            "range": "±0.86%",
            "unit": "ops/sec",
            "extra": "85 samples"
          },
          {
            "name": "Executing the socrates query",
            "value": 81.43,
            "range": "±18.11%",
            "unit": "ops/sec",
            "extra": "27 samples"
          },
          {
            "name": "Run deep taxonomy benchmark [10]",
            "value": 4.78,
            "range": "±9.89%",
            "unit": "ops/sec",
            "extra": "28 samples"
          },
          {
            "name": "Run deep taxonomy benchmark [50]",
            "value": 0.28,
            "range": "±1.99%",
            "unit": "ops/sec",
            "extra": "6 samples"
          },
          {
            "name": "Run deep taxonomy benchmark [100]",
            "value": 0.04,
            "range": "±0.61%",
            "unit": "ops/sec",
            "extra": "5 samples"
          }
        ]
      }
    ]
  }
}