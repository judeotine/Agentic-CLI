# Silent Failure Hunter Agent

**Name**: silent-failure-hunter  
**Model**: configurable (anthropic, gpt-4, local-llm, or custom)  
**Description**: Analyzes error handling to detect silent failures, inadequate error handling, and inappropriate fallback behavior

## Focus Areas

### 1. Silent Failures in Catch Blocks
Detects catch blocks that:
- Swallow errors without logging
- Return generic fallback values
- Continue execution inappropriately
- Mask underlying issues

### 2. Inadequate Error Handling
Identifies:
- Missing try-catch for async operations
- Unhandled promise rejections
- Missing error boundaries in React
- Insufficient error context

### 3. Inappropriate Fallback Behavior
Flags:
- Silent fallbacks that hide issues
- Default values that mask errors
- Swallowed exceptions in critical paths
- Missing error propagation

### 4. Missing Error Logging
Checks for:
- Caught exceptions without logging
- Missing context in error messages
- No error tracking/monitoring
- Lost stack traces

## Severity Ratings

**Critical (Score: 10)**: Silent failure in critical path (auth, payments, data integrity)  
**High (Score: 7-9)**: Important operations with poor error handling  
**Medium (Score: 4-6)**: Non-critical but should be addressed  
**Low (Score: 1-3)**: Minor issues or edge cases  

**Only reports issues with score ≥ 7**

## Detection Patterns

### Anti-Patterns

```typescript
// SILENT FAILURE - Score: 10
try {
  await criticalOperation();
} catch (error) {
  return null; // Silently fails!
}

// INADEQUATE LOGGING - Score: 8
try {
  await processPayment();
} catch (error) {
  console.log('Error'); // No context!
}

// INAPPROPRIATE FALLBACK - Score: 9
try {
  const data = await fetchUserData();
} catch (error) {
  return {}; // Empty object hides the issue
}

// MISSING ERROR PROPAGATION - Score: 7
async function helper() {
  try {
    await operation();
  } catch (error) {
    // Caught but not re-thrown or handled
  }
}
```

### Best Practices

```typescript
// PROPER ERROR HANDLING
try {
  await criticalOperation();
} catch (error) {
  logger.error('Critical operation failed', {
    error,
    context: { userId, operationId },
    stack: error.stack
  });
  throw new ApplicationError('Operation failed', { cause: error });
}

// PROPER FALLBACK
try {
  const data = await fetchUserData();
  return data;
} catch (error) {
  logger.warn('Failed to fetch user data, using cache', { error });
  return cacheService.getUserData();
}

// PROPER ASYNC HANDLING
async function processQueue() {
  const promises = items.map(item => 
    processItem(item).catch(error => {
      logger.error('Item processing failed', { item, error });
      return null; // Explicitly handled
    })
  );
  
  const results = await Promise.all(promises);
  return results.filter(r => r !== null);
}
```

## Integration with Agentic CLI

Automatically integrates with:
- **Security Scanner**: Cross-references security vulnerabilities
- **Test Generator**: Suggests error handling tests
- **Session Audit**: Logs detected issues
- **Git Integration**: Blocks commits with critical issues (if configured)

## Output Format

```
Silent Failure Hunter Results
===========================================

Reviewing: src/auth/service.ts, src/payment/processor.ts

CRITICAL Issues (Score: 90-100):

[CRITICAL - Score: 95] src/payment/processor.ts:45
Silent failure in payment processing
---
try {
  await processPayment(order);
} catch (error) {
  return { success: false }; // No logging!
}
---
Fix: Add proper error logging and monitoring
Suggestion:
try {
  await processPayment(order);
} catch (error) {
  logger.error('Payment processing failed', { order, error });
  await notifyMonitoring('payment_failure', { orderId: order.id });
  throw new PaymentError('Failed to process payment', { cause: error });
}

IMPORTANT Issues (Score: 80-89):

[IMPORTANT - Score: 82] src/auth/service.ts:78
Inadequate error logging
---
catch (error) {
  console.log('Auth error'); // Missing context
}
---
Fix: Include error details and user context
Suggestion: logger.error('Authentication failed', { userId, error, stack: error.stack })

Summary:
- 2 critical issues requiring immediate attention
- 1 important issue to address
- 0 minor issues

Recommendation: Fix critical issues before merging PR
```

## Usage

```bash
# Review current changes
agentic review-security

# Review specific files
agentic agent:run silent-failure-hunter "Review error handling in src/auth/"

# Part of comprehensive PR review
agentic review-pr  # Includes silent-failure-hunter
```

## Configuration

```yaml
# ~/.agentic/config.yaml
plugins:
  pr-review-toolkit:
    silent_failure_hunter:
      # Minimum severity to report
      min_severity: 7
      
      # Check async operations
      check_async: true
      
      # Check Promise handling
      check_promises: true
      
      # Block commits with critical issues
      block_on_critical: false
```

## Tips

1. **Run before PR creation**: Catch issues early
2. **Focus on critical paths**: Auth, payments, data operations
3. **Review async code carefully**: Promises and error handling
4. **Add logging context**: Include relevant data in error logs
5. **Propagate errors properly**: Don't swallow important errors

