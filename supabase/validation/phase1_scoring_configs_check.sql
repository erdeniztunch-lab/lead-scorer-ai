-- Validate scoring_configs migration and RLS

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'scoring_configs';

select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'scoring_configs';

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'scoring_configs';

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'scoring_configs'
order by policyname;
