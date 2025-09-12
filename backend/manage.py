# backend/manage.py
import os
import click
from flask.cli import with_appcontext
from app import create_app
from extensions import db

app = create_app()

# Path to your SQLite DB file
DB_PATH = os.path.join(os.path.dirname(__file__), "breathe_smart.db")

@app.cli.command("reset-db")
@with_appcontext
def reset_db():
    """Drop all tables and recreate them (also deletes SQLite file)."""
    if os.path.exists(DB_PATH):
        click.echo(f"⚠️  Deleting old database file: {DB_PATH}")
        os.remove(DB_PATH)

    click.echo("✅ Creating fresh database...")
    db.create_all()
    click.echo("🎉 Database reset complete.")