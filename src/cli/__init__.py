"""CLI entry point for ani-sage metadata core."""

import typer
from .metadata import app as metadata_app

app = typer.Typer(
    help="ani-sage metadata core utilities",
    no_args_is_help=True
)

# Add subcommands
app.add_typer(metadata_app, name="metadata", help="Metadata extraction utilities")

if __name__ == "__main__":
    app()
