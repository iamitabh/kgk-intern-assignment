
# KGK Internship Assignment

1. Install PostgreSQL: Download and install PostgreSQL from the official website. While installing put the default password as you wish and keep it remeber so that it can be put in the enivormental variable later on.

2. Access Database: Using "SQL Shell" you can access the database which would be running on 5432.

2. Create Tables: Create necessary tables in your database. You can use SQL commands or tools like pgAdmin to create tables and define schema. Here we are using an table named 'auth'.

3. Initialize Node Project: Use 'npm init -y' to initialize a project. And then by using 'npm i dotenv express jsonwebtoken' install these necessary packages.

4. SetUp the enivormental variables: Create a .env file and put your senstive data in it. Like
PG_USER=your_postgres_username
PG_PASSWORD=your_postgres_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=your_database_name
JWT_SECRET=your_jwt_secret_key