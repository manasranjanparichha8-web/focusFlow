# FocusFlow AI Security Specification

## Data Invariants
1. A Task must belong to the authenticated user (`userId == request.auth.uid`).
2. Users can only read/write their own tasks and stats.
3. Terminal status (e.g., 'completed') locks the task from further updates except by admins (if any).
4. `startTime` must be set on creation.

## The "Dirty Dozen" Payloads (Anti-Patterns)
1. **Identity Spoofing**: Creating a task for another user (`userId: 'stolen_uid'`).
2. **Ghost Field Injection**: Adding `isVerified: true` to a task to bypass validation.
3. **ID Poisoning**: Using a 2KB string as a `taskId`.
4. **State Shortcutting**: Updating `isMeaningful` without setting `status` to completed.
5. **Backdating**: Setting `startTime` to a past date (though we usually trust client time for start, we validate it's a string).
6. **Orphaned Stats**: Updating `userStats` without a valid `userId`.
7. **Size Attack**: Sending a `description` that is 1MB in size.
8. **Malicious Enum**: Setting `type` to `hacker_activity`.
9. **Recursive Update**: Trying to increment `totalMinutes` by 1,000,000 in one go.
10. **Shadow List**: Passing a huge list in an unexpected field.
11. **PII Leak**: Querying for all tasks where `userId` is not the current user.
12. **Null Pointers**: sending a delete request with zero auth.

## Test Runner (Logic Check)
The rules will be tested to ensure these return `PERMISSION_DENIED`.
