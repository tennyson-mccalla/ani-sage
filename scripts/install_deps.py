#!/usr/bin/env python3
"""
Dependency installer for ani-sage AI features.

This script installs the required dependencies for the ani-sage AI features.
It creates a virtual environment if needed to handle externally managed environments.
"""

import os
import sys
import subprocess
import argparse
import venv
from pathlib import Path


def create_venv(venv_path):
    """Create a virtual environment.

    Args:
        venv_path: Path to create the virtual environment

    Returns:
        bool: True if successful, False otherwise
    """
    print(f"Creating virtual environment at {venv_path}...")
    try:
        venv.create(venv_path, with_pip=True)
        return True
    except Exception as e:
        print(f"Error creating virtual environment: {e}")
        return False


def get_venv_python(venv_path):
    """Get the path to the Python executable in the virtual environment.

    Args:
        venv_path: Path to the virtual environment

    Returns:
        str: Path to the Python executable
    """
    if os.name == 'nt':  # Windows
        return os.path.join(venv_path, 'Scripts', 'python.exe')
    else:  # Unix-like
        return os.path.join(venv_path, 'bin', 'python')


def install_dependencies(venv_path=None, upgrade=False):
    """Install the required dependencies.

    Args:
        venv_path: Path to virtual environment (or None for system install)
        upgrade: Whether to upgrade existing packages

    Returns:
        int: Exit code (0 for success)
    """
    print("Installing dependencies for ani-sage AI features...")

    # Path to requirements.txt
    req_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "requirements.txt"
    )

    if not os.path.exists(req_path):
        print(f"Error: Requirements file not found at {req_path}")
        return 1

    # Determine Python executable
    if venv_path:
        python_exe = get_venv_python(venv_path)
    else:
        python_exe = sys.executable

    # Build install command
    cmd = [python_exe, "-m", "pip", "install", "-r", req_path]

    if upgrade:
        cmd.append("--upgrade")

    # Run the installation
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.call(cmd)

    if result == 0:
        print("\nDependencies installed successfully!")

        if venv_path:
            # Print activation instructions
            print("\nTo activate the virtual environment:")
            if os.name == 'nt':  # Windows
                print(f"    {os.path.join(venv_path, 'Scripts', 'activate.bat')}")
            else:  # Unix-like
                print(f"    source {os.path.join(venv_path, 'bin', 'activate')}")

            # Create a simple activation script
            proj_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

            if os.name == 'nt':  # Windows
                activate_script = os.path.join(proj_root, "activate_venv.bat")
                with open(activate_script, 'w') as f:
                    f.write(f"@echo off\n")
                    f.write(f"echo Activating AI features virtual environment...\n")
                    f.write(f"call {os.path.join(venv_path, 'Scripts', 'activate.bat')}\n")
            else:  # Unix-like
                activate_script = os.path.join(proj_root, "activate_venv.sh")
                with open(activate_script, 'w') as f:
                    f.write("#!/bin/bash\n")
                    f.write("echo Activating AI features virtual environment...\n")
                    f.write(f"source {os.path.join(venv_path, 'bin', 'activate')}\n")

                # Make the activation script executable
                os.chmod(activate_script, 0o755)

            print(f"\nYou can also use the activation script: {activate_script}")

        return 0
    else:
        print("\nError installing dependencies. Please try manually:")
        print(f"pip install -r {req_path}")
        return 1


def main():
    """Run the installer."""
    parser = argparse.ArgumentParser(
        description="Install dependencies for ani-sage AI features"
    )

    parser.add_argument(
        "-u", "--upgrade",
        action="store_true",
        help="Upgrade existing packages"
    )

    parser.add_argument(
        "-v", "--venv",
        help="Path to create/use a virtual environment (default: 'venv' in project root)"
    )

    parser.add_argument(
        "-s", "--system",
        action="store_true",
        help="Install packages in the system Python (not recommended)"
    )

    args = parser.parse_args()

    # Determine if we should use a virtual environment
    if args.system:
        # Use system Python
        return install_dependencies(venv_path=None, upgrade=args.upgrade)
    else:
        # Use a virtual environment
        if args.venv:
            venv_path = args.venv
        else:
            # Default venv path in project root
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            venv_path = os.path.join(project_root, "venv")

        # Create the virtual environment if it doesn't exist
        if not os.path.exists(venv_path):
            if not create_venv(venv_path):
                return 1

        return install_dependencies(venv_path=venv_path, upgrade=args.upgrade)


if __name__ == "__main__":
    sys.exit(main())
