#!/bin/bash
for bt in "Commercial Buildings" "Residential Buildings" "Industrial Buildings" "Institutional Buildings"; do
  result=$(curl -s http://localhost:4000/api/v1/evaluate -X POST -H 'Content-Type: application/json' -d "{\"buildingType\":\"$bt\"}")
  obs=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result']['obs'])")
  neb=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result']['nebClass'])")
  echo "$bt: OBS=$obs NEB=$neb"
done
