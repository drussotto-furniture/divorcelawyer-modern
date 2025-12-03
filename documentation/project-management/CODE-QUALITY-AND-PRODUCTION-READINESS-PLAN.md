# Code Quality & Production Readiness Plan

## Executive Summary

This document outlines a comprehensive plan to assess, improve, and maintain code quality for the DivorceLawyer.com platform. The project has been developed iteratively ("vibe coded") and requires systematic evaluation and improvement before production deployment.

## Current State Assessment

### Codebase Metrics

**Project Structure:**
- **Framework**: Next.js 16+ with React 19
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **API Routes**: ~40+ API endpoints
- **Components**: 50+ React components
- **Database Migrations**: 62 SQL migration files
- **Admin Pages**: 20+ admin interface pages

**Code Quality Indicators:**
- ✅ TypeScript enabled (type safety)
- ✅ ESLint configured
- ⚠️ No test files found (0 test files)
- ⚠️ Extensive console.log usage (185+ instances across 45 files)
- ⚠️ Error handling present but inconsistent (59 try-catch blocks)
- ⚠️ No centralized logging system
- ⚠️ No monitoring/observability setup

**Risk Areas:**
1. **No Test Coverage**: Zero automated tests
2. **Inconsistent Error Handling**: Mix of try-catch, console.error, and silent failures
3. **Debug Code in Production**: Console.logs throughout codebase
4. **Large Component Files**: Some components exceed 1000+ lines
5. **Complex Business Logic**: Subscription system with multiple layers (global/groups/exceptions)
6. **Database Complexity**: 62 migrations, complex relationships

---

## Phase 1: Code Analysis & Metrics (Week 1-2)

### 1.1 Automated Code Analysis

**Tools to Install:**
```bash
npm install --save-dev \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-react-hooks \
  eslint-plugin-import \
  complexity-report \
  cloc
```

**Metrics to Collect:**
- **Lines of Code**: Total LOC, by file type, by directory
- **Cyclomatic Complexity**: Identify overly complex functions
- **Code Duplication**: Find repeated code patterns
- **File Size**: Identify files that need refactoring (>500 lines)
- **Dependency Analysis**: Check for unused dependencies, security vulnerabilities
- **Type Coverage**: Ensure TypeScript strict mode compliance

**Action Items:**
1. Run `cloc` to get accurate code metrics
2. Set up ESLint with complexity rules
3. Generate complexity report for all files
4. Identify top 20 most complex files
5. Create code quality dashboard

### 1.2 Manual Code Review Checklist

**Critical Areas to Review:**

#### API Routes (`app/api/`)
- [ ] Error handling consistency
- [ ] Input validation
- [ ] Authentication/authorization checks
- [ ] Rate limiting considerations
- [ ] Response format consistency
- [ ] Database query optimization
- [ ] RLS policy compliance

#### Components (`components/`, `app/admin/`)
- [ ] Component size (target: <300 lines)
- [ ] Prop drilling vs context usage
- [ ] State management patterns
- [ ] Performance (unnecessary re-renders)
- [ ] Accessibility (a11y)
- [ ] Error boundaries

#### Database (`supabase/migrations/`)
- [ ] Migration dependency order
- [ ] Rollback scripts
- [ ] Index optimization
- [ ] Foreign key constraints
- [ ] RLS policy completeness
- [ ] Data integrity checks

#### Business Logic (`lib/`, `app/api/`)
- [ ] Subscription system logic
- [ ] Location-based queries
- [ ] Search functionality
- [ ] Data transformation functions

**Deliverable**: Code Review Report with prioritized issues

---

## Phase 2: Testing Strategy (Week 2-4)

### 2.1 Testing Framework Setup

**Recommended Stack:**
- **Unit Tests**: Vitest (faster than Jest, better ESM support)
- **Integration Tests**: Vitest + MSW (Mock Service Worker)
- **E2E Tests**: Playwright (better than Cypress for Next.js)
- **API Tests**: Supertest or Vitest with fetch mocks

**Installation:**
```bash
npm install --save-dev \
  vitest @vitest/ui \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event \
  msw \
  @playwright/test \
  happy-dom
```

### 2.2 Test Coverage Goals

**Priority 1: Critical Business Logic (80%+ coverage)**
- Subscription upgrade/downgrade logic
- DMA assignment and pricing resolution
- Subscription limit checking
- Location-based lawyer search
- Plan override calculations

**Priority 2: API Routes (70%+ coverage)**
- All `/api/subscription/*` endpoints
- All `/api/admin/subscription-plans/*` endpoints
- Lawyer search endpoints
- Authentication/authorization flows

**Priority 3: Components (60%+ coverage)**
- Admin subscription management UI
- Upgrade/downgrade flow
- Lawyer profile forms
- Critical user-facing components

**Priority 4: Utilities (90%+ coverage)**
- Price conversion functions
- Data transformation utilities
- Validation functions

### 2.3 Test Implementation Plan

**Week 2: Foundation**
1. Set up Vitest configuration
2. Create test utilities and helpers
3. Set up MSW for API mocking
4. Create test data factories
5. Write 5-10 example tests as templates

**Week 3: Critical Path Tests**
1. Subscription upgrade/downgrade API tests
2. Subscription plan resolution tests
3. DMA assignment logic tests
4. Price calculation tests

**Week 4: Component Tests**
1. Admin subscription plans page
2. Upgrade page component
3. Lawyer edit form (subscription section)
4. Critical admin components

**Ongoing:**
- Add tests for new features
- Maintain coverage thresholds
- Update tests when refactoring

### 2.4 Test Structure

```
tests/
├── unit/
│   ├── lib/
│   │   └── utils/
│   │       └── price-conversion.test.ts
│   └── components/
│       └── admin/
├── integration/
│   ├── api/
│   │   ├── subscription/
│   │   └── admin/
│   └── database/
│       └── migrations/
└── e2e/
    ├── subscription-flow.spec.ts
    ├── admin-subscription-management.spec.ts
    └── lawyer-search.spec.ts
```

---

## Phase 3: Code Refactoring Priorities (Week 3-6)

### 3.1 High Priority Refactoring

#### A. Centralize Error Handling
**Current Issue**: Inconsistent error handling, console.logs everywhere

**Solution:**
1. Create error handling utility (`lib/errors/`)
2. Create logging service (`lib/logging/`)
3. Replace all `console.log/error` with structured logging
4. Create error boundary components
5. Standardize API error responses

**Files to Create:**
- `lib/errors/AppError.ts` - Custom error classes
- `lib/logging/logger.ts` - Centralized logger (use Pino or Winston)
- `components/ErrorBoundary.tsx` - React error boundary
- `lib/api/error-handler.ts` - API error handler middleware

#### B. Extract Business Logic
**Current Issue**: Business logic mixed with UI components

**Solution:**
1. Create service layer (`lib/services/`)
2. Extract subscription logic to `lib/services/subscription.service.ts`
3. Extract location logic to `lib/services/location.service.ts`
4. Extract pricing logic to `lib/services/pricing.service.ts`

**Benefits:**
- Easier to test
- Reusable across components
- Clearer separation of concerns

#### C. Component Refactoring
**Current Issue**: Large component files (e.g., `LawyerEditForm.tsx` ~1900 lines)

**Solution:**
1. Break down into smaller components
2. Extract form sections into separate components
3. Use custom hooks for complex logic
4. Create component library for reusable UI

**Target File Sizes:**
- Components: <300 lines
- Hooks: <150 lines
- Utilities: <200 lines

#### D. API Route Standardization
**Current Issue**: Inconsistent patterns across API routes

**Solution:**
1. Create API route wrapper/middleware
2. Standardize request/response formats
3. Create shared validation utilities
4. Implement consistent error responses

**Create:**
- `lib/api/middleware.ts` - Auth, validation, error handling
- `lib/api/validators/` - Input validation schemas (Zod)
- `lib/api/responses.ts` - Standardized response helpers

### 3.2 Medium Priority Refactoring

#### E. Type Safety Improvements
1. Enable TypeScript strict mode
2. Remove `any` types (use proper types)
3. Create shared type definitions
4. Use discriminated unions for better type safety

#### F. Database Query Optimization
1. Review all Supabase queries
2. Add missing indexes
3. Optimize N+1 query patterns
4. Add query result caching where appropriate

#### G. State Management
1. Evaluate need for state management library (Zustand/Redux)
2. Reduce prop drilling
3. Create context providers for shared state
4. Optimize re-renders

### 3.3 Low Priority (Technical Debt)

- Remove unused code
- Update dependencies
- Improve code comments
- Standardize naming conventions
- Add JSDoc comments for complex functions

---

## Phase 4: Production Readiness (Week 4-8)

### 4.1 Security Audit

**Checklist:**
- [ ] Environment variables properly secured
- [ ] API keys not exposed in client code
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection
- [ ] Authentication/authorization on all protected routes
- [ ] Rate limiting on public APIs
- [ ] Input validation on all user inputs
- [ ] Secure headers (CORS, CSP, etc.)
- [ ] Dependency vulnerability scan

**Tools:**
```bash
npm audit
npm install --save-dev @next/bundle-analyzer
```

### 4.2 Performance Optimization

**Metrics to Track:**
- Page load times
- API response times
- Database query performance
- Bundle sizes
- Core Web Vitals

**Optimizations:**
1. Code splitting (dynamic imports)
2. Image optimization (Next.js Image component)
3. Database query optimization
4. Caching strategy (API routes, static pages)
5. Bundle size reduction

**Tools:**
- Next.js Bundle Analyzer
- Lighthouse CI
- Web Vitals monitoring

### 4.3 Monitoring & Observability

**Required Setup:**

#### A. Error Tracking
- **Tool**: Sentry (recommended) or LogRocket
- **What to Track**:
  - Client-side errors
  - Server-side errors
  - API errors
  - Database errors

#### B. Application Performance Monitoring (APM)
- **Tool**: Vercel Analytics (built-in) or Datadog/New Relic
- **What to Monitor**:
  - API response times
  - Database query performance
  - Page load times
  - Error rates

#### C. Logging
- **Tool**: Structured logging (Pino/Winston)
- **What to Log**:
  - API requests/responses
  - Business events (subscription upgrades, etc.)
  - Authentication events
  - Critical operations

#### D. Uptime Monitoring
- **Tool**: UptimeRobot, Pingdom, or Vercel Status
- **What to Monitor**:
  - Main application URL
  - Critical API endpoints
  - Database connectivity

**Implementation:**
1. Set up Sentry for error tracking
2. Configure Vercel Analytics
3. Create logging service
4. Set up uptime monitoring
5. Create monitoring dashboard

### 4.4 Documentation

**Required Documentation:**

#### A. Technical Documentation
1. **Architecture Overview** (`documentation/architecture/`)
   - System architecture diagram
   - Database schema documentation
   - API documentation (OpenAPI/Swagger)
   - Component library documentation

2. **Development Guide** (`documentation/development/`)
   - Setup instructions
   - Development workflow
   - Code style guide
   - Testing guide
   - Deployment process

3. **API Documentation**
   - All API endpoints documented
   - Request/response examples
   - Authentication requirements
   - Error codes and meanings

#### B. Operational Documentation
1. **Runbook** (`documentation/operations/`)
   - Common issues and solutions
   - Deployment procedures
   - Rollback procedures
   - Database migration process
   - Backup/restore procedures

2. **Monitoring Guide**
   - How to check system health
   - Alert thresholds
   - Incident response procedures

### 4.5 Database Management

**Checklist:**
- [ ] All migrations tested in staging
- [ ] Rollback scripts for critical migrations
- [ ] Database backup strategy
- [ ] Migration dependency documentation
- [ ] Data integrity checks
- [ ] Performance indexes reviewed
- [ ] RLS policies tested

**Create:**
- Migration testing procedure
- Backup/restore documentation
- Database maintenance schedule

---

## Phase 5: Code Review Process (Ongoing)

### 5.1 Pre-Commit Hooks

**Setup Husky + lint-staged:**
```bash
npm install --save-dev husky lint-staged
```

**Configure:**
- Run ESLint on staged files
- Run Prettier on staged files
- Run type checking
- Prevent committing console.logs
- Run tests (if changed files are test-related)

### 5.2 Pull Request Checklist

**Automated Checks:**
- [ ] All tests pass
- [ ] Code coverage maintained/improved
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Bundle size within limits
- [ ] No security vulnerabilities

**Manual Review:**
- [ ] Code follows style guide
- [ ] Error handling appropriate
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Documentation updated
- [ ] Breaking changes documented

### 5.3 Code Review Guidelines

**Review Focus Areas:**
1. **Functionality**: Does it work as intended?
2. **Security**: Any security vulnerabilities?
3. **Performance**: Any performance issues?
4. **Maintainability**: Is code easy to understand?
5. **Testing**: Are there adequate tests?
6. **Documentation**: Is it well-documented?

---

## Phase 6: Maintenance & Continuous Improvement (Ongoing)

### 6.1 Regular Audits

**Monthly:**
- Dependency updates
- Security vulnerability scans
- Code quality metrics review
- Test coverage review

**Quarterly:**
- Full code review of critical paths
- Performance audit
- Architecture review
- Technical debt assessment

### 6.2 Metrics Dashboard

**Track:**
- Test coverage percentage
- Code complexity metrics
- Bundle size trends
- Error rates
- Performance metrics
- Technical debt score

### 6.3 Refactoring Backlog

Maintain a prioritized backlog of:
- Code smells to fix
- Performance optimizations
- Architecture improvements
- Technical debt items

---

## Implementation Timeline

### Weeks 1-2: Assessment & Planning
- ✅ Code metrics collection
- ✅ Risk assessment
- ✅ Tool selection
- ✅ Plan creation (this document)

### Weeks 3-4: Foundation
- Set up testing framework
- Create error handling infrastructure
- Set up logging
- Write initial tests (critical paths)

### Weeks 5-6: Critical Refactoring
- Extract business logic
- Refactor large components
- Standardize API routes
- Improve error handling

### Weeks 7-8: Production Readiness
- Security audit
- Performance optimization
- Monitoring setup
- Documentation completion

### Weeks 9+: Ongoing
- Maintain test coverage
- Continuous refactoring
- Regular audits
- Team training

---

## Success Metrics

### Code Quality
- **Test Coverage**: >70% overall, >80% for critical paths
- **Type Safety**: 100% TypeScript, no `any` types
- **Code Complexity**: Average cyclomatic complexity <10
- **Code Duplication**: <5%

### Production Readiness
- **Error Rate**: <0.1% of requests
- **Uptime**: >99.9%
- **API Response Time**: P95 <500ms
- **Page Load Time**: <3s (Lighthouse)

### Maintainability
- **Average File Size**: <300 lines
- **Documentation Coverage**: 100% of public APIs
- **Code Review Time**: <24 hours
- **Deployment Frequency**: Daily (CI/CD)

---

## Tools & Resources

### Code Quality
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **SonarQube**: Code quality analysis (optional)

### Testing
- **Vitest**: Unit/integration testing
- **Playwright**: E2E testing
- **MSW**: API mocking
- **Testing Library**: Component testing

### Monitoring
- **Sentry**: Error tracking
- **Vercel Analytics**: Performance monitoring
- **Pino/Winston**: Structured logging
- **UptimeRobot**: Uptime monitoring

### Documentation
- **JSDoc**: Code documentation
- **Swagger/OpenAPI**: API documentation
- **Mermaid**: Architecture diagrams

---

## Risk Mitigation

### High Risk Areas

1. **Subscription System**
   - **Risk**: Complex business logic, financial implications
   - **Mitigation**: Comprehensive testing, code review, staging validation

2. **Database Migrations**
   - **Risk**: Data loss, production downtime
   - **Mitigation**: Backup strategy, rollback scripts, staging testing

3. **Authentication/Authorization**
   - **Risk**: Security vulnerabilities
   - **Mitigation**: Security audit, penetration testing, code review

4. **No Test Coverage**
   - **Risk**: Regressions, bugs in production
   - **Mitigation**: Prioritize critical path tests, gradual coverage increase

---

## Next Steps

1. **Immediate (This Week)**:
   - Review and approve this plan
   - Set up code analysis tools
   - Begin collecting metrics
   - Create GitHub issues for Phase 1 tasks

2. **Short Term (Next 2 Weeks)**:
   - Set up testing framework
   - Create error handling infrastructure
   - Write first batch of tests
   - Begin refactoring high-priority items

3. **Medium Term (Next Month)**:
   - Complete critical refactoring
   - Achieve 50%+ test coverage
   - Set up monitoring
   - Complete security audit

4. **Long Term (Ongoing)**:
   - Maintain code quality
   - Continuous improvement
   - Regular audits
   - Team training

---

## Conclusion

This plan provides a structured approach to improving code quality, testability, and production readiness. The key is to prioritize critical areas first (subscription system, API routes, error handling) while building a foundation for long-term maintainability.

**Estimated Total Effort**: 6-8 weeks for initial implementation, then ongoing maintenance.

**Key Success Factors**:
1. Executive buy-in and time allocation
2. Prioritization (focus on critical paths first)
3. Incremental approach (don't try to fix everything at once)
4. Team training on new tools and processes
5. Continuous monitoring and improvement

