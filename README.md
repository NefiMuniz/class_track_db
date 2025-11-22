# Overview

ClassTrack is an academic task manager designed for learners seeking a practical, organized solution to track courses and assignments using a modern web app architecture. The project applies a Python Flask backend and a SQL (SQLite 3) database to build real-world skills in building, integrating, and operating with relational databases—covering everything from API design to persistent (local) data logic. The intuitive frontend provides real-time visual updates as users track, update, and complete assignments, giving immediate feedback on courses, due dates, and completion status.

This app connects to a SQLite 3 database, performing all create, read, update, and delete (CRUD) operations directly with SQL using Python. While deployed on Render.com, the project intentionally runs with a local SQLite 3 file in the backend container. Note: due to limitations of the Render free tier (ephemeral filesystem), your data will be lost each time the service sleeps, restarts, or redeploys, so the database is best suited for demo or learning purposes.

A unique feature is the "Seed Database" button—which allows one-click population of the application with sample courses and assignments, helping new users or reviewers to explore ClassTrack right away.

[Software Demo Video](http://youtube.link.goes.here)

# Relational Database

ClassTrack uses Python's built-in sqlite3 library to interact with a lightweight SQL database file. This relational database includes:

Tables:
courses: Stores course metadata (name, code, color, credits, semester)
assignments: Stores assignment records, linked to courses by foreign key
assignment_history: Tracks changes to assignments for activity logging

Each record relationship is strictly enforced using foreign keys, and SQL JOIN queries power features like statistics, completion rates, and reporting.

# Development Environment

Tools:

Visual Studio Code (VSCode)
Git & GitHub for source control
Render.com for web deployment (using a non-persistent SQLite database)

Languages/Libraries:

Python 3.x (Flask, flask-cors, python-dotenv, sqlite3)
HTML5, CSS3 (custom styles)
JavaScript (ES6+, fetch API)

# Useful Websites

{Make a list of websites that you found helpful in this project}

- [Flask Documentation](https://flask.palletsprojects.com/en/stable/)
- [SQLite3 Python](https://docs.python.org/3/library/sqlite3.html)
- [Render Flask Deployment Guide](https://render.com/docs/deploy-flask)

# Future Work

- Implement user authentication and profiles
- Add support for persistent database (Cloud PostgreSQL)
- Implement notifications through email