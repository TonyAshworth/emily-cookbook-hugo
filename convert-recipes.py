#!/usr/bin/env python3
"""
Convert Eleventy recipes to Hugo format
"""
import os
import re
import shutil
from pathlib import Path

def convert_recipe_file(source_file, dest_dir):
    """Convert a single recipe file from Eleventy to Hugo format"""
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split frontmatter and content
    parts = content.split('---', 2)
    if len(parts) < 3:
        print(f"Warning: No frontmatter found in {source_file}")
        return
    
    frontmatter = parts[1].strip()
    body_content = parts[2].strip()
    
    # Parse frontmatter
    title = ""
    tags = []
    description = ""
    date = ""
    
    for line in frontmatter.split('\n'):
        line = line.strip()
        if line.startswith('title:'):
            title = line.replace('title:', '').strip()
        elif line.startswith('tags:'):
            # Handle tags array
            continue
        elif line.startswith('- ') and 'tags:' in frontmatter:
            tag = line.replace('- ', '').strip()
            if tag:
                tags.append(tag)
        elif line.startswith('description:'):
            description = line.replace('description:', '').strip().strip("'\"")
        elif line.startswith('date:'):
            date = line.replace('date:', '').strip()
    
    # Create Hugo frontmatter
    hugo_frontmatter = f"""+++
title = '{title}'
date = '{date if date else '2024-01-01'}'
draft = false
tags = {tags}
categories = ['recipes']
description = '{description}'
+++"""
    
    # Combine frontmatter and content
    hugo_content = f"{hugo_frontmatter}\n\n{body_content}"
    
    # Create destination file
    dest_file = dest_dir / source_file.name
    with open(dest_file, 'w', encoding='utf-8') as f:
        f.write(hugo_content)
    
    print(f"Converted: {source_file.name}")

def main():
    """Main conversion function"""
    source_dir = Path("D:/Development/emily-cookbook/src/posts")
    dest_dir = Path("D:/Development/emily-cookbook-hugo/content/recipes")
    
    # Create destination directory
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # Convert all markdown files
    for md_file in source_dir.glob("*.md"):
        convert_recipe_file(md_file, dest_dir)
    
    print(f"Conversion complete! Converted recipes are in: {dest_dir}")

if __name__ == "__main__":
    main()
