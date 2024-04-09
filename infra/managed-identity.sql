-- Select proper database
USE "bar-database";

-- To add a system assigned Web App as DB user.
CREATE USER "petter-managed-identity-app63fdea6e" FROM EXTERNAL PROVIDER;
ALTER USER "petter-managed-identity-app63fdea6e" WITH DEFAULT_SCHEMA = BlikkTest;
ALTER ROLE db_datareader ADD MEMBER "petter-managed-identity-app63fdea6e";
ALTER ROLE db_datawriter ADD MEMBER "petter-managed-identity-app63fdea6e";

-- To remove a system assigned web app DB user.
ALTER ROLE db_datareader DROP MEMBER "petter-managed-identity-app63fdea6e";
ALTER ROLE db_datawriter DROP MEMBER "petter-managed-identity-app63fdea6e";
DROP USER "petter-managed-identity-app63fdea6e";
