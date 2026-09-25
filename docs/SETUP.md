# Setup and deployment

## Local development

Requirements: Docker Desktop. From the repository root, start the app and MySQL:

```bash
docker-compose up --build
```

Open [http://localhost:8080/pages/user/login.html](http://localhost:8080/pages/user/login.html). Stop the services with `docker-compose down`. To reset the local database and delete its volume, run `docker-compose down -v`.

Compose creates the local `fprojectdb_mysql` database and applies `init.sql` the first time the database volume is initialized. The DB connection values (`DB_HOST=db`, `DB_USER=appuser`, `DB_PASS=apppassword`, `DB_NAME=fprojectdb_mysql`) are set directly in `docker-compose.yml`; a root `.env` file does not override those values. To change them, update the matching Compose environment settings.

The app can start without external service credentials, but these features need additional configuration:

| Feature | Local configuration |
| --- | --- |
| Profile/project/resume uploads and stored asset reads | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and `R2_PUBLIC_URL`. |
| Contact email delivery | `SENDGRID_API_KEY`, verified `SENDGRID_FROM_EMAIL`, and recipient `CONTACT_EMAIL`. |
| TLS connection to a managed database | `DB_SSL_CA` path to the CA certificate. Not needed for the local Compose MySQL service. |

PHP loads a root `.env` file through phpdotenv, so it can supply these optional service settings locally. Keep real credentials out of source control. `init.sql` does not create an administrator account; signup creates standard users. To enable the admin UI in local development, create an account through signup, then promote that account in the local database:

```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

Use the same controlled bootstrap process for the first production administrator.

## Production deployment

The production setup uses a Render Docker web service, Aiven MySQL, Cloudflare R2, and SendGrid. Locally, Compose uses `fprojectdb_mysql`. Both GitHub Actions workflows currently hard-code the Aiven database name `defaultdb`. Render's production `DB_NAME` must also be `defaultdb` for the app, backup, and cleanup workflows to use the same schema. If the production app uses a different database name, update the workflow commands to match it.

1. Provision the Aiven MySQL service and apply `init.sql` to the database selected for production (currently `defaultdb`).
2. Configure a Render Web Service for this repository using the Docker runtime.
3. Set the database variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, and `DB_SSL_CA`. Set Render's `DB_NAME` to `defaultdb` to match the current workflow target.
4. Set the R2 credentials and bucket variables (`R2_*`).
5. For contact email, set `SENDGRID_API_KEY`, verified `SENDGRID_FROM_EMAIL`, and receiving `CONTACT_EMAIL`.
6. Deploy. Later pushes to the connected branch trigger redeployment.

GitHub Actions provides two operational workflows: `.github/workflows/db-backup.yml` dumps `defaultdb` to dated and `latest.sql` objects in R2 weekly (and on manual runs), while `.github/workflows/analytics-cleanup.yml` removes page-view records older than six months monthly (and on manual runs). Configure `AIVEN_HOST`, `AIVEN_PORT`, `AIVEN_USER`, `AIVEN_PASSWORD`, and the required `R2_*` repository secrets before running them. To restore, download the desired backup object and import it into the intended database with the MySQL client; the SQL dump contains the schema and data. These workflows automate maintenance and recovery; they are not build/test CI jobs. Render provides continuous deployment from the connected Git branch.

### Bootstrap the first production administrator

`init.sql` creates the schema but does not seed an administrator. Create the intended account through signup first. Then, from a trusted machine with the Aiven CA certificate (`ca.pem`), set `AIVEN_HOST`, `AIVEN_PORT`, and `AIVEN_USER` from the Aiven connection details and connect to the production database over TLS. Keep Render's `DB_NAME` set to `defaultdb` as described above. The password option below prompts securely; do not add the password to the command.

```bash
mysql --host="$AIVEN_HOST" --port="$AIVEN_PORT" --user="$AIVEN_USER" --password --ssl-ca=ca.pem defaultdb
```

In the MySQL prompt, replace `your_username` with the exact account created above. Confirm the `SELECT` returns exactly that account with role `user` before running the update:

```sql
START TRANSACTION;
SELECT id, username, role FROM users WHERE username = 'your_username' FOR UPDATE;
UPDATE users SET role = 'admin' WHERE username = 'your_username' AND role = 'user';
SELECT ROW_COUNT() AS promoted_rows;
SELECT id, username, role FROM users WHERE username = 'your_username';
```

Commit only if `promoted_rows` is `1` and the final query shows the intended account as `admin`. Otherwise run `ROLLBACK;`, verify the database and username, and retry. Finish with `COMMIT;` after confirmation. This promotes only the selected user; treat the account as an administrator credential.
