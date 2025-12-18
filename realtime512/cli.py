"""CLI entry point for realtime512"""

import click

from .start.run_start import run_start
from .serve.run_serve import run_serve

@click.group()
@click.version_option(version="0.1.0")
def main():
    """realtime512 - Real time processing of multi-electrode data."""
    pass

@main.command()
def start():
    """Start real-time processing of multi-electrode data."""
    run_start()

@main.command()
@click.option("--host", default="127.0.0.1", help="Host to bind to (default: 127.0.0.1)")
@click.option("--port", default=5000, help="Port to bind to (default: 5000)")
def serve(host, port):
    """Serve raw and computed data via HTTP API."""
    run_serve(host=host, port=port)

if __name__ == "__main__":
    main()
