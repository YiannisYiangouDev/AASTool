curl -s http://localhost:4000/health
echo "---"
curl -s -X POST http://localhost:4000/api/v1/criteria \
  -H "Content-Type: application/json" \
  -d '{"code":"EC9.9.9","name":"Test","definition":"Test def","value":0.5,"disability":1,"dimension":1,"levels":["L1","L2","L3","L4","L5"]}'
