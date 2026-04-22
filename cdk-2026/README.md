プライベートなRDSを作ってみる。
PC からの接続手順
1. Endpoint ID を確認


aws ec2 describe-instance-connect-endpoints \
  --query 'InstanceConnectEndpoints[0].InstanceConnectEndpointId' \
  --output text
2. トンネルを開く（ターミナル1）


aws ec2-instance-connect open-tunnel \
  --instance-connect-endpoint-id eice-xxxxxxxxxxxxxxxxx \
  --remote-port 3306 \
  --local-port 13306 \
  --remote-host <Aurora クラスターエンドポイント>
3. MySQL クライアントで接続（ターミナル2）


mysql -h 127.0.0.1 -P 13306 -u admin -p
