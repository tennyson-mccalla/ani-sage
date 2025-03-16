# Ani-Sage Development Guide

## Build & Development Commands
- **Run tests**: `jest`
- **Run single test**: `jest -t "test name pattern"`
- **Test specific file**: `jest path/to/file.test.js`
- **Test with coverage**: `jest --coverage`
- **Performance testing**: Use performance.now() for timing analysis

## Code Style Guidelines
- **ES6/TypeScript**: Use modern JavaScript/TypeScript features
- **Types**: Define interfaces in data-models.ts, use JSDoc in .js files
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces
- **Error handling**: Use try/catch with specific error handling
- **Immutability**: Create new objects rather than mutating existing ones
- **Documentation**: JSDoc comments for all functions and interfaces
- **Modules**: Clear separation of concerns between files
- **Testing**: Unit, integration, psychological validation, edge cases
- **Async**: Use async/await for asynchronous operations

## Git Workflow
- Do not EVER append any copyright claim or authorship claim to git commits, like:
  " 🤖 Generated with https://claude.ai/code
  Co-Authored-By: Claude mailto:noreply@anthropic.com"

## Project Architecture
- Psychological mapping between user profiles and anime attributes
- MCP integration for context awareness
- Modular design with separation between data models and algorithms
- Test-driven development with comprehensive test coverage