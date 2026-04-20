
## 3. **CONTRIBUTING.md**

```markdown
# Contributing to Amstapay

First off, thank you for considering contributing to Amstapay! It's people like you that make Amstapay such a great tool.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include screenshots if possible
- Include your environment details (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see
- Explain why this enhancement would be useful

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Follow the JavaScript/Node.js styleguides
- Include thoughtfully-worded, well-structured tests
- Document new code
- End all files with a newline

## Development Process

### Setting Up Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/amstapay-backend.git

# Add upstream remote
git remote add upstream https://github.com/Akintomiwa200/amstapay-backend.git

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run tests to ensure everything works
npm test
```

### Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. Make your changes following our coding standards

3. Run tests and linters:
```bash
npm run lint
npm test
npm run test:coverage
```

4. Commit your changes:
```bash
git add .
git commit -m "feat: add amazing feature"
# Follow conventional commit format
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding/updating tests
- `chore:` Maintenance tasks
- `ci:` CI/CD changes

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `hotfix/` - Urgent fixes
- `release/` - Release branches

## Style Guides

### JavaScript/Node.js Style Guide

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use template literals for string concatenation
- Use `const` for variables that don't change
- Use `let` for variables that change
- Avoid `var`
- Use arrow functions
- Add trailing commas in objects and arrays
- Use uppercase for constants

```javascript
// Good
const user = {
  name: 'John',
  email: 'john@example.com',
};

const greeting = `Hello, ${user.name}!`;

// Bad
var user = {
    name: "John",
    email: "john@example.com"
};
```

### Testing Guidelines

- Write tests for all new features
- Aim for 90%+ code coverage
- Use descriptive test names
- Test both success and failure cases

```javascript
describe('User Service', () => {
  it('should create a new user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    const user = await UserService.create(userData);
    expect(user.email).toBe(userData.email);
  });
});
```

### Documentation Guidelines

- Use JSDoc for function documentation
- Keep README up to date
- Document API endpoints in OpenAPI format
- Include examples in documentation

```javascript
/**
 * Creates a new transaction
 * @param {ObjectId} senderId - The sender's user ID
 * @param {ObjectId} recipientId - The recipient's user ID
 * @param {number} amount - Transaction amount
 * @returns {Promise<Transaction>} Created transaction
 * @throws {Error} If insufficient balance
 */
async function createTransaction(senderId, recipientId, amount) {
  // Implementation
}
```

## Review Process

1. **Automated Checks**: All PRs must pass:
   - Linting checks
   - Unit tests
   - Integration tests
   - Code coverage threshold

2. **Manual Review**: At least one maintainer must approve:
   - Code quality
   - Test coverage
   - Documentation
   - Security implications

3. **Merge**: After approval, a maintainer will merge your PR

## Release Process

1. **Version Bump**: Update version in `package.json`
2. **Changelog**: Update CHANGELOG.md
3. **Tag**: Create git tag for version
4. **Release**: GitHub release with release notes

## Questions or Need Help?

- Join our [Discord](https://discord.gg/amstapay)
- Email: contributors@amstapay.com
- Open a discussion on GitHub

---

Thank you for contributing to Amstapay! 🚀
```
