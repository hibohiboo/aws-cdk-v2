-- https://postgresweb.com/createuser
-- ユーザー名「user1」をパスワード「pass」で作成する
CREATE USER user1 WITH PASSWORD 'pass';

-- https://www.dbonline.jp/postgresql/role/index3.html
-- publicスキーマの全てのテーブルの参照権限を付与
GRANT SELECT ON ALL TABLES IN SCHEMA public TO user1;