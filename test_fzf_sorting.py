#!/usr/bin/env python3
"""
Test script for FZF sorting options.
This script demonstrates different FZF sorting behaviors.
"""

import os
import sys
import subprocess
from typing import List, Optional, Union

def fzf_prompt(prompt: str, options: List[str], multi: bool = False, sort_option: Optional[str] = None, layout_option: Optional[str] = None) -> List[str]:
    """
    Present options to the user using FZF and return their selection.

    Args:
        prompt: The prompt to display to the user
        options: List of options to present
        multi: Whether to allow multiple selections
        sort_option: Sorting option to pass to FZF (e.g., "--no-sort", "--tac")
        layout_option: Layout option to pass to FZF (e.g., "--layout=reverse", "--layout=default")

    Returns:
        List of selected options
    """
    # Build command with minimal options
    cmd = ["fzf", "--border"]

    # Add header/prompt
    cmd.extend(["--header", prompt])

    # Add multi selection if requested
    if multi:
        cmd.append("--multi")

    # Add layout option if provided
    if layout_option:
        for opt in layout_option.split():
            cmd.append(opt)

    # Add sorting option if provided
    if sort_option:
        for opt in sort_option.split():
            cmd.append(opt)

    # Print the command being used
    print(f"Command: {' '.join(cmd)}")

    # Run FZF
    process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True
    )

    # Pass options to FZF
    stdout, stderr = process.communicate(input="\n".join(options))

    # Return selections (empty list if nothing selected or canceled)
    if process.returncode == 0:
        return [line.strip() for line in stdout.split("\n") if line.strip()]
    else:
        print(f"FZF exited with code {process.returncode}")
        print(f"Stderr: {stderr}")
        return []

def main():
    """Run tests for different FZF sorting options."""
    print("\n=== Testing FZF Sorting Options ===\n")

    # Sample data - alphabetically ordered list
    options = [
        "Action",
        "Adventure",
        "Comedy",
        "Drama",
        "Fantasy",
        "Horror",
        "Mystery",
        "Romance",
        "Sci-Fi",
        "Thriller"
    ]

    print("Options in original order:")
    for i, opt in enumerate(options, 1):
        print(f"{i}. {opt}")
    print("\n")

    # Test cases
    test_cases = [
        ("Default (no options)", None, None),
        ("With --no-sort only", "--no-sort", None),
        ("With --layout=default", None, "--layout=default"),
        ("With --layout=default --no-sort", "--no-sort", "--layout=default"),
        ("With --layout=reverse", None, "--layout=reverse"),
        ("With --layout=reverse --no-sort", "--no-sort", "--layout=reverse"),
    ]

    for desc, sort_opt, layout_opt in test_cases:
        print(f"\n=== Test: {desc} ===")
        input(f"Press Enter to start test with {desc}...")

        selections = fzf_prompt(
            f"Select genres (Tab to select multiple) - {desc}",
            options,
            multi=True,
            sort_option=sort_opt,
            layout_option=layout_opt
        )

        print("\nYou selected:")
        for sel in selections:
            print(f"- {sel}")

        print("\n" + "="*50)

if __name__ == "__main__":
    main()
