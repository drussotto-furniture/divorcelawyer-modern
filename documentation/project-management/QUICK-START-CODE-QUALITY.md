# Quick Start: Code Quality Improvement

## TL;DR - What You Need to Know

Your codebase is **functional but needs systematic improvement** before production. Here's the quick summary:

### Current State
- ✅ **Working code** - The app functions
- ⚠️ **No tests** - Zero test coverage
- ⚠️ **185+ console.logs** - Debug code in production
- ⚠️ **Inconsistent patterns** - Different error handling approaches
- ⚠️ **Large files** - Some components 1000+ lines

### Risk Level: **MEDIUM-HIGH**
- Complex subscription system (financial implications)
- No automated testing (regression risk)
- Inconsistent error handling (production issues)

---

## Immediate Actions (This Week)

### 1. Install Code Analysis Tools (30 minutes)

```bash
cd /Users/drussotto/code-projects/divorcelawyer-modern

# Install analysis tools
npm install --save-dev \
  cloc \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-react-hooks \
  complexity-report

# Run initial analysis
npx cloc app components lib --exclude-dir=node_modules,.next
```

### 2. Set Up Testing Framework (2 hours)

```bash
# Install testing tools
npm install --save-dev \
  vitest @vitest/ui \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event \
  msw \
  happy-dom

# Create vitest.config.ts
```

**Create `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### 3. Create First Test (1 hour)

**Create `tests/unit/lib/utils/price-conversion.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest'

// Test the price conversion utility we just created
function priceDisplayToCents(priceDisplay: string): number {
  if (!priceDisplay || priceDisplay.trim() === '') return 0
  const cleaned = priceDisplay.replace(/[$,\s]/g, '')
  const dollars = parseFloat(cleaned)
  if (isNaN(dollars)) return 0
  return Math.round(dollars * 100)
}

describe('priceDisplayToCents', () => {
  it('converts "$1,490" to 149000', () => {
    expect(priceDisplayToCents('$1,490')).toBe(149000)
  })

  it('handles "$1490" without comma', () => {
    expect(priceDisplayToCents('$1490')).toBe(149000)
  })

  it('handles empty string', () => {
    expect(priceDisplayToCents('')).toBe(0)
  })

  it('handles invalid input', () => {
    expect(priceDisplayToCents('invalid')).toBe(0)
  })
})
```

Run: `npm test`

### 4. Set Up Error Logging (1 hour)

**Create `lib/logging/logger.ts`:**
```typescript
// Simple logger that can be replaced with Pino/Winston later
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  log(level: LogLevel, message: string, data?: any) {
    if (level === 'error' || this.isDevelopment) {
      const timestamp = new Date().toISOString()
      const logEntry = {
        timestamp,
        level,
        message,
        ...(data && { data }),
      }
      
      if (level === 'error') {
        console.error(JSON.stringify(logEntry))
      } else {
        console.log(JSON.stringify(logEntry))
      }
    }
    // In production, send to logging service (Sentry, etc.)
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }
}

export const logger = new Logger()
```

**Replace console.log:**
```typescript
// Before
console.log('User upgraded subscription')

// After
import { logger } from '@/lib/logging/logger'
logger.info('User upgraded subscription', { userId, planId })
```

---

## Priority Order (What to Fix First)

### 🔴 Critical (Do First)
1. **Subscription System Tests** - Financial implications
2. **Error Handling** - Production stability
3. **Remove console.logs** - Security/privacy

### 🟡 High Priority (Do Next)
4. **API Route Tests** - Core functionality
5. **Component Refactoring** - Large files
6. **Type Safety** - Remove `any` types

### 🟢 Medium Priority (Do Later)
7. **Performance Optimization**
8. **Documentation**
9. **Monitoring Setup**

---

## Quick Wins (Can Do Today)

### 1. Find All console.logs
```bash
# Find all console.log statements
grep -r "console\." app components lib --include="*.ts" --include="*.tsx" | wc -l

# Create a list to replace
grep -rn "console\." app components lib --include="*.ts" --include="*.tsx" > console-logs.txt
```

### 2. Find Large Files
```bash
# Find files over 500 lines
find app components lib -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20
```

### 3. Check TypeScript Strict Mode
```bash
# Check tsconfig.json
cat tsconfig.json | grep strict
```

### 4. Count API Routes
```bash
find app/api -name "route.ts" | wc -l
```

---

## Testing Strategy (Simplified)

### Week 1: Foundation
- Set up Vitest
- Write 5-10 example tests
- Test price conversion utility (already created)

### Week 2: Critical Path
- Subscription upgrade API test
- Subscription plan resolution test
- DMA assignment test

### Week 3: Expand
- More API route tests
- Component tests for admin pages

### Goal: 50% coverage in 4 weeks, 70% in 8 weeks

---

## Code Review Checklist (For Every PR)

### Before Merging:
- [ ] Tests pass
- [ ] No console.logs (use logger)
- [ ] Error handling added
- [ ] TypeScript compiles (no errors)
- [ ] ESLint passes
- [ ] No `any` types (unless justified)

### Code Quality:
- [ ] Functions < 50 lines
- [ ] Components < 300 lines
- [ ] Meaningful variable names
- [ ] Comments for complex logic

---

## Tools You'll Need

### Already Have:
- ✅ TypeScript
- ✅ ESLint
- ✅ Next.js

### Need to Add:
- ⚠️ Vitest (testing)
- ⚠️ Testing Library (component tests)
- ⚠️ MSW (API mocking)
- ⚠️ Playwright (E2E tests - later)
- ⚠️ Sentry (error tracking - later)

---

## Estimated Time Investment

### Initial Setup (Week 1)
- **Day 1**: Install tools, run analysis (4 hours)
- **Day 2**: Set up testing framework (4 hours)
- **Day 3**: Write first tests (4 hours)
- **Day 4-5**: Begin refactoring (8 hours)

**Total Week 1**: ~20 hours

### Ongoing (Per Week)
- **Testing**: 4-8 hours/week
- **Refactoring**: 4-8 hours/week
- **Code Review**: 2-4 hours/week

**Total Ongoing**: ~10-20 hours/week

---

## Success Criteria

### After 1 Month:
- ✅ 50%+ test coverage on critical paths
- ✅ Error logging system in place
- ✅ No console.logs in production code
- ✅ All critical API routes tested

### After 3 Months:
- ✅ 70%+ overall test coverage
- ✅ All large files refactored
- ✅ Monitoring and error tracking set up
- ✅ Documentation complete

### After 6 Months:
- ✅ 80%+ test coverage
- ✅ Production-ready codebase
- ✅ Automated CI/CD with tests
- ✅ Full observability

---

## Getting Help

### Resources:
- **Full Plan**: See `CODE-QUALITY-AND-PRODUCTION-READINESS-PLAN.md`
- **Vitest Docs**: https://vitest.dev/
- **Testing Library**: https://testing-library.com/
- **Next.js Testing**: https://nextjs.org/docs/app/building-your-application/testing

### Questions to Consider:
1. Do you have time allocated for this? (10-20 hours/week)
2. Do you need help from other developers?
3. What's your production deadline?
4. What's the risk tolerance? (affects testing priority)

---

## Next Steps

1. **Read the full plan**: `CODE-QUALITY-AND-PRODUCTION-READINESS-PLAN.md`
2. **Run initial analysis**: Install tools and run metrics
3. **Set up testing**: Install Vitest and write first test
4. **Create logger**: Replace console.logs gradually
5. **Prioritize**: Focus on subscription system first (highest risk)

**Remember**: This is a marathon, not a sprint. Start small, build momentum, and maintain consistency.

