PC からの接続手順
1. Endpoint ID を確認


aws ec2 describe-instance-connect-endpoints \
  --query 'InstanceConnectEndpoints[0].InstanceConnectEndpointId' \
  --output text
2. <Aurora クラスターエンドポイント>のIP を確認

aws rds describe-db-clusters \
  --query 'DBClusters[0].Endpoint' \
  --output text

# Aurora エンドポイントを IP に解決(powershell)
Resolve-DnsName 上記コマンドの結果（xxx.northeast-1.rds.amazonaws.com）

Aurora はフェイルオーバー時に IP が変わる可能性があります。接続できなくなったら再度Resolve-DnsName で IP を取り直してください。

3. トンネルを開く（ターミナル1）

aws ec2-instance-connect open-tunnel \
  --instance-connect-endpoint-id eice-xxxxxxxxxxxxxxxxx \
  --remote-port 3389 \
  --local-port 13306 \
  --private-ip-address <Aurora クラスターエンドポイントのIP>

4. MySQL クライアントで接続（ターミナル2）

mysql -h 127.0.0.1 -P 13306 -u admin -p
パスワードは Secrets Manager から取得できます。

(jqが入っている前提でSecretMangerからパスワードを確認する方法)
aws secretsmanager get-secret-value \
  --secret-id $(aws secretsmanager list-secrets --query 'SecretList[?contains(Name, `AuroraCluster`)].Name' --output text) \
  --query 'SecretString' --output text | jq -r '.password'


構成のポイント
EC2 インスタンス不要（踏み台サーバーなし）
EIC → Aurora 3389 のみ通信を許可（最小権限）
EIC Endpoint 自体は無料（データ転送料のみ）



