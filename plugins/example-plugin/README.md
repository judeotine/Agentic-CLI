# Example Plugin

This is an example plugin demonstrating the CLI Agent plugin architecture.

## Features

- Custom command: `hello`
- Pre-edit and post-edit hooks
- File system permissions

## Structure

```
example-plugin/
├── manifest.json      # Plugin metadata and configuration
├── index.ts          # Main plugin code
└── README.md         # This file
```

## Creating Your Own Plugin

1. Create a new directory in `plugins/`
2. Add a `manifest.json` file following the schema
3. Create your main file (e.g., `index.ts`)
4. Implement the Plugin interface:
   - `manifest`: Plugin metadata
   - `commands`: Array of command handlers
   - `hooks`: Map of hook handlers
   - `initialize`: Setup function
   - `cleanup`: Teardown function

## Example manifest.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My custom plugin",
  "main": "index.js",
  "commands": [
    {
      "name": "my-command",
      "description": "Does something cool"
    }
  ],
  "hooks": ["pre-edit", "post-commit"],
  "permissions": {
    "fileSystem": true,
    "git": false,
    "network": false
  }
}
```

## Available Hooks

- `pre-command`: Before any command executes
- `post-command`: After any command completes
- `pre-edit`: Before file edits
- `post-edit`: After file edits
- `pre-commit`: Before git commits
- `post-commit`: After git commits

## Plugin Context

Your plugin receives a context object with:

- `config`: Full application configuration
- `logger`: Logging utilities
- `utils`: Helper functions
  - `exec(command)`: Execute shell commands
  - `readFile(path)`: Read files
  - `writeFile(path, content)`: Write files

