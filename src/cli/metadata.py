"""CLI interface for metadata extraction."""

import json
import sys
from enum import Enum
from pathlib import Path
from typing import List, Optional, TextIO, Union

import rich
import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from ..utils.config import Config
from ..utils.metadata import AnimeMetadata, extract_metadata, format_metadata_display

# Create Typer app
app = typer.Typer(
    help="Metadata extraction for anime files",
    no_args_is_help=True
)

# Create rich console for stderr (status messages)
status_console = Console(stderr=True)
# Create rich console for stdout (results)
output_console = Console()

class OutputFormat(str, Enum):
    """Output format options."""
    TEXT = "text"
    JSON = "json"
    TABLE = "table"
    RAW = "raw"  # Raw format for piping

def process_file(path: Path) -> Optional[AnimeMetadata]:
    """Process a single file and extract metadata.

    Args:
        path: Path to the file

    Returns:
        Extracted metadata or None if file is not valid
    """
    if not path.is_file() or path.suffix.lower() not in {'.mkv', '.mp4', '.avi'}:
        return None

    try:
        return extract_metadata(path)
    except Exception as e:
        status_console.print(f"[red]Error processing {path}: {e}[/red]")
        return None

def format_output(
    metadata: List[AnimeMetadata],
    format: OutputFormat,
    output_file: Optional[TextIO] = None,
    quiet: bool = False
) -> None:
    """Format and display metadata results.

    Args:
        metadata: List of metadata objects
        format: Output format to use
        output_file: Optional file to write output to
        quiet: Whether to suppress rich formatting
    """
    if format == OutputFormat.RAW:
        # Raw format for piping - one result per line
        output = "\n".join(
            f"{m.filename}\t{m.series}\t{m.season or ''}\t{m.episode or ''}\t{m.quality or ''}\t{m.group or ''}\t{m.special or ''}"
            for m in metadata
        )
    elif format == OutputFormat.JSON:
        # Convert to dictionary representation
        data = [
            {
                "filename": str(m.filename),
                "series": m.series,
                "season": m.season,
                "episode": m.episode,
                "quality": m.quality,
                "group": m.group,
                "special": m.special
            }
            for m in metadata
        ]
        output = json.dumps(data, indent=2 if not quiet else None)
    else:
        # Use StringIO to capture rich output
        from io import StringIO
        temp_output = StringIO()
        temp_console = Console(file=temp_output, force_terminal=not quiet)

        if format == OutputFormat.TABLE:
            table = Table(show_header=True, header_style="bold" if not quiet else None)
            table.add_column("Series")
            table.add_column("Season")
            table.add_column("Episode")
            table.add_column("Quality")
            table.add_column("Group")
            table.add_column("Special")
            table.add_column("Filename")

            for m in metadata:
                table.add_row(
                    m.series,
                    m.season or "-",
                    m.episode or "-",
                    m.quality or "-",
                    m.group or "-",
                    m.special or "-",
                    str(m.filename.name)
                )
            temp_console.print(table)
        else:  # TEXT format
            for m in metadata:
                temp_console.print(format_metadata_display(m))

        output = temp_output.getvalue()
        temp_output.close()

    if output_file:
        output_file.write(output)
        output_file.write("\n")
    else:
        print(output)

@app.command()
def extract(
    path: Path = typer.Argument(..., help="Path to anime file", exists=True),
    format: OutputFormat = typer.Option(
        OutputFormat.TEXT,
        "--format", "-f",
        help="Output format"
    ),
    output: Optional[Path] = typer.Option(
        None,
        "--output", "-o",
        help="Output file (defaults to stdout)"
    ),
    quiet: bool = typer.Option(
        False,
        "--quiet", "-q",
        help="Suppress rich formatting (useful for scripting)"
    )
) -> None:
    """Extract metadata from a single anime file."""
    metadata = process_file(path)
    if metadata:
        output_file = open(output, 'w') if output else None
        try:
            format_output([metadata], format, output_file, quiet)
        finally:
            if output_file:
                output_file.close()

@app.command()
def scan(
    directory: Path = typer.Argument(..., help="Directory to scan", exists=True, file_okay=False),
    recursive: bool = typer.Option(False, "--recursive", "-r", help="Scan recursively"),
    format: OutputFormat = typer.Option(
        OutputFormat.TEXT,
        "--format", "-f",
        help="Output format"
    ),
    output: Optional[Path] = typer.Option(
        None,
        "--output", "-o",
        help="Output file (defaults to stdout)"
    ),
    quiet: bool = typer.Option(
        False,
        "--quiet", "-q",
        help="Suppress rich formatting and progress (useful for scripting)"
    ),
    series_filter: Optional[str] = typer.Option(None, "--series", "-s", help="Filter by series name"),
    quality_filter: Optional[str] = typer.Option(None, "--quality", "-q", help="Filter by quality"),
    group_filter: Optional[str] = typer.Option(None, "--group", "-g", help="Filter by release group")
) -> None:
    """Scan directory for anime files and extract metadata."""
    pattern = "**/*" if recursive else "*"
    results = []

    if not quiet:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
            console=status_console
        ) as progress:
            task = progress.add_task("Scanning files...", total=None)
            results = scan_directory(directory, pattern, series_filter, quality_filter, group_filter)
            progress.update(task, completed=True)
    else:
        results = scan_directory(directory, pattern, series_filter, quality_filter, group_filter)

    if not results:
        status_console.print("[yellow]No matching files found[/yellow]")
        return

    output_file = open(output, 'w') if output else None
    try:
        format_output(results, format, output_file, quiet)
    finally:
        if output_file:
            output_file.close()

def scan_directory(
    directory: Path,
    pattern: str,
    series_filter: Optional[str],
    quality_filter: Optional[str],
    group_filter: Optional[str]
) -> List[AnimeMetadata]:
    """Scan directory and apply filters.

    Args:
        directory: Directory to scan
        pattern: Glob pattern
        series_filter: Optional series name filter
        quality_filter: Optional quality filter
        group_filter: Optional group filter

    Returns:
        List of matching metadata
    """
    results = []
    for path in directory.glob(pattern):
        metadata = process_file(path)
        if metadata:
            # Apply filters
            if series_filter and series_filter.lower() not in metadata.series.lower():
                continue
            if quality_filter and metadata.quality != quality_filter:
                continue
            if group_filter and metadata.group != group_filter:
                continue
            results.append(metadata)
    return results

@app.command()
def config(
    add_dir: Optional[Path] = typer.Option(None, "--add", help="Add anime directory"),
    remove_dir: Optional[Path] = typer.Option(None, "--remove", help="Remove anime directory"),
    clear: bool = typer.Option(False, "--clear", help="Clear all anime directories"),
    list_dirs: bool = typer.Option(False, "--list", help="List configured anime directories"),
    quiet: bool = typer.Option(
        False,
        "--quiet", "-q",
        help="Suppress rich formatting (useful for scripting)"
    )
) -> None:
    """Manage anime directory configuration."""
    config = Config.load()

    if add_dir:
        config.add_anime_dir(add_dir)
        if not quiet:
            status_console.print(f"[green]Added directory: {add_dir}[/green]")

    elif remove_dir:
        config.remove_anime_dir(remove_dir)
        if not quiet:
            status_console.print(f"[yellow]Removed directory: {remove_dir}[/yellow]")

    elif clear:
        config.clear_anime_dirs()
        if not quiet:
            status_console.print("[yellow]Cleared all directories[/yellow]")

    elif list_dirs:
        if not config.anime_dirs:
            if not quiet:
                status_console.print("[yellow]No directories configured[/yellow]")
            return

        if quiet:
            for directory in config.anime_dirs:
                print(directory)
        else:
            table = Table(show_header=True, header_style="bold")
            table.add_column("Configured Directories")
            for directory in config.anime_dirs:
                table.add_row(str(directory))
            output_console.print(table)

    else:
        status_console.print("Use --help to see available options")

if __name__ == "__main__":
    app()
