#!/bin/bash
# Same skewed scores - Physical (DT=1) high, Sensory (DT=2) low
SCORES='{"EC1.1.1":5,"EC1.1.2":5,"EC1.2.1":5,"EC2.1.1":1,"EC2.1.2":1,"EC2.2.1":1}'
for bt in "Commercial Buildings" "Residential Buildings"; do
  result=$(curl -s http://localhost:4000/api/v1/evaluate -X POST -H 'Content-Type: application/json' -d "{\"buildingType\":\"$bt\",\"scores\":$SCORES}")
  obs=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result']['obs'])")
  echo "$bt: OBS=$obs"
done
