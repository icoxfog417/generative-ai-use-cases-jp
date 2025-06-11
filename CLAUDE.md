# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Generative AI Use Cases (GenU)** - an AWS-based platform providing various generative AI capabilities through a web application and browser extension. The project has a strong focus on Japanese business use cases.

## Key Commands

### Development

```bash
# Install dependencies
npm ci

# Run web app with AWS integration
npm run web:devw

# Run browser extension
npm run extension:devw

# Run documentation site
npm run docs:dev

# Run tests
npm run test

# Run linting
npm run lint

# Run specific package tests
npm run web:test
npm run cdk:test
```

### Deployment

```bash
# Full deployment
npm run cdk:deploy

# Quick deployment (skip some checks)
npm run cdk:deploy:quick

# Deploy specific stack
npx -w packages/cdk cdk deploy <stack-name>

# Destroy deployment
npm run cdk:destroy
```

### Browser Extension

```bash
# Build for Chrome/Edge
npm run extension:build

# Build for Firefox (MV2)
npm run extension:build:firefox

# Development mode with hot reload
npm run extension:devw
```

## Architecture Overview

### Monorepo Structure

- **`/packages/web/`**: React-based web application frontend
- **`/packages/cdk/`**: AWS CDK infrastructure code
- **`/browser-extension/`**: Chrome/Edge browser extension
- **`/docs/`**: MkDocs documentation site

### AWS Architecture

The CDK stack deploys:

- API Gateway + Lambda functions for backend APIs
- DynamoDB tables for data persistence
- S3 buckets for file storage with pre-signed URLs
- Cognito User Pools with optional SAML authentication
- CloudFront distribution for static assets
- Optional: Amazon Kendra for RAG capabilities
- Optional: Bedrock Knowledge Base for advanced RAG
- Optional: Bedrock agents and flows

### Key Configuration

- **`/packages/cdk/cdk.json`**: Central deployment configuration
  - Model configurations (Claude, Nova, DeepSeek, etc.)
  - Feature toggles (RAG, agents, SAML, use case builder)
  - Security settings (allowed IPs, countries)
- **Environment variables**: Set via CDK context or `.env` files
- **SAML configuration**: Supports Google Workspace and Microsoft Entra ID

### Frontend Architecture

- React with TypeScript
- AWS Amplify for authentication and API integration
- i18n support (ja, en, th, zh)
- Tailwind CSS for styling
- Vite for build tooling

### API Structure

The backend follows a pattern of:

- `/packages/cdk/lambda/` - Lambda function implementations
- APIs are defined in `/packages/cdk/lib/constructs/api.ts`
- Common patterns: chat, predict, file upload/download, RAG queries

## Important Development Notes

### When Working with Models

- Check available models in `cdk.json` under `modelConfig`
- Model IDs follow Bedrock naming conventions
- Some models require specific regions or cross-account roles

### When Modifying Frontend

- Use existing components from `/packages/web/src/components/`
- Follow i18n patterns - all user-facing text should use translation keys
- Test with different languages using the language selector

### When Adding New Features

- Update `cdk.json` with appropriate feature flags
- Add Lambda functions in `/packages/cdk/lambda/`
- Update API Gateway routes in the CDK constructs
- Add frontend components following existing patterns
- Update documentation in both English and Japanese

### Security Considerations

- IP restrictions are configured in `cdk.json` under `allowedIpV4AddressRanges`
- SAML authentication requires proper IdP configuration
- File uploads use pre-signed S3 URLs with time limits
- Bedrock Guardrails can be configured for content moderation
