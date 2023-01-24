# Grow Simplee Backend

## Before Running (Prerequisites)

- Install `node_modules`, by running the following command (Note: package manager used for this project is **yarn**)
  ```sh
  yarn install
  ```
- Create a `.env` file, with the following contents:

  ```env
  PORT=5000
  CLIENT_URL=<enter the client url>
  NODE_ENV='development' # would be subject to change.

  # Database settings
  DATABASE_URL='mysql://<url-encoded USERNAME>:<url-encoded PASSWORD>@<HOSTNAME>:<PORT>/<DATABASE>'

  # JWT secret
  TOKEN_SECRET=<super secret something>

  # Mailing credentials
  MAILING_EMAIL=<mailing email>
  MAILING_PASSWORD=<mailing password>

  # Super Admin credentials
  SUPER_ADMIN_EMAIL=<super-admin email>
  SUPER_ADMIN_PASSWORD=<super-admin password>
  ```

- Install the Redis server.

  - For Debian-based Linux distributions, the following command should do:
    ```bash
    sudo apt install redis-server
    ```
  - For macOS users, with homebrew installed:
    ```zsh
    brew install redis-server
    ```
  - For Windows users, since there doesn't seem to be any support. You might wanna install WSL2. Refer [this](https://redis.io/docs/getting-started/installation/install-redis-on-windows/).

- Install MySQL server and MySQL Workbench.

- Create Database as per the URI set in the env

- Apply migrations to database by running the following command:
  ```bash
  yarn run prisma migrate dev
  ```

## Before commiting:

- Run the following command:
  ```bash
  $ yarn run fmt
  $ yarn run fmt-check
  $ yarn run lint
  ```

- Please ensure that above commands return with exit-code 0. (PS: warnings from `eslint` are acceptable)

## How to run?

- Basic
  ```sh
  yarn run start
  ```
- For development
  ```sh
  yarn run dev
  ```

## Database (MySQL with Prisma for Database handling)

1. Make sure that you have populated the `DATABASE_URL` environment variable in your `.env` file with a valid URL.
2. Populate the file `prisma/schema.prisma` with appropriate models.
3. Run the following command:
   ```sh
   yarn run prisma migrate dev --name <NAME>
   ```
   Here _NAME_ is the name of the migration you wish to give.
4. The above command takes care of 2 things:
   - Makes appropriate changes to the database.
   - generates `@prisma/client` which has typing and functions for each model as ORM.
5. Make sure that `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` exist as environment variables, they act as the credentials for logging in as the super admin.

## Conventions you might wanna abide by.

- Use _kebab-case_ for URL paths.

  - Undesirable Examples:
    - `/user/forgotPassword` ❌
    - `/User/Forgot-Password` ❌
    - `/get_User_Details` ❌
  - Acceptable Examples:
    - `/user/forgot-password` ✅
    - `/get-user-details` ✅
