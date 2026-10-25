# TradeSync Security Specification & Access Control Model

## 1. Data Invariants

1. **User Isolation**: A user's profile (`/users/{userId}`) can only be created and updated by the authenticated user (`request.auth.uid == userId`). No user can change another user's personal risk parameters or balance.
2. **Personal Watchlists**: `/personalWatchlists/{userId}/tokens/{tokenId}` is strictly private to `request.auth.uid == userId`. No other user can read or write.
3. **Team Membership & Relational Access Gate**: All team-shared subcollections (`/teams/{teamId}/...`) require the requesting user to be an approved member in `/teams/{teamId}/members/$(request.auth.uid)`.
4. **Three-Member Hard Limit & Ownership**: A team can have at most 3 approved members. The Owner role can invite/approve members and update shared team risk policies. Members cannot elevate themselves to 'owner'.
5. **Trade Author Autonomy**: A paper trade (`/teams/{teamId}/paperTrades/{tradeId}`) can only be created or modified by its designated author (`request.auth.uid == incoming().userId` and `request.auth.uid == existing().userId`). Other team members may view authorized aggregated performance, but cannot edit or tamper with another member's paper trades.
6. **Activity Feed Immutability**: Team activity items can be created by authenticated team members, but cannot be modified or deleted by members to preserve audit trail integrity.
7. **Research & Watchlist Integrity**: Shared watchlist tokens and research reports can be created, updated, and reviewed by approved team members, with strict string length limits and validation of creator IDs.

## 2. The "Dirty Dozen" Attack Vectors Tested

1. **Unauthenticated Read on Team Data**: Attacker without JWT attempts reading `/teams/room1/paperTrades`. Result: REJECTED.
2. **Non-Member Team Snooping**: Valid Firebase user not in `The Trading Room` attempts reading shared watchlist. Result: REJECTED.
3. **Impersonated Trade Creation**: User A creates a paper trade setting `userId: "user_B"`. Result: REJECTED (Enforced `incoming().userId == request.auth.uid`).
4. **Trade Tampering**: User B attempts updating User A's trade exit price or rationale. Result: REJECTED (Enforced `existing().userId == request.auth.uid`).
5. **Personal Watchlist Scraping**: User A attempts querying User B's `/personalWatchlists/{user_B}/tokens`. Result: REJECTED.
6. **Self-Promotion to Team Owner**: Member attempts updating their role from `member` to `owner` in `/teams/{teamId}/members/{userId}`. Result: REJECTED.
7. **Denial-of-Wallet Payload Injection**: Malicious actor submits a 2MB thesis string or invalid type. Result: REJECTED (`thesis.size() <= 4000`).
8. **Orphaned Sub-Resource Creation**: Submitting a trade to a non-existent team ID without approved membership. Result: REJECTED (`isTeamMember(teamId)` check fails).
9. **Activity Feed Forgery / Deletion**: Deleting past activity logs to hide bad trades. Result: REJECTED (`allow delete: if false`).
10. **Shadow Key Injection on Update**: Updating a trade while injecting arbitrary administrative fields. Result: REJECTED (`hasOnly` keys constraint).
11. **Id Poisoning**: Passing 500-character malicious path variables for document IDs. Result: REJECTED (`isValidId(id)` constraint).
12. **Unverified Email Access Bypass**: Attempting writes with an unverified email account where verified email is enforced. Result: REJECTED.
