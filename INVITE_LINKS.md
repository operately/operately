# Shareable Team Invite Links

This document describes the shareable team invite links feature implemented in Operately.

## Overview

Shareable invite links allow company administrators to generate URLs that can be shared with potential team members to join their company without requiring individual email invitations.

## Features

### Invite Link Generation
- Generate shareable links from the company setup page (`/{companyId}/invite-team`)
- Links expire automatically after 7 days
- Each link includes a cryptographically secure 32+ character token
- Links can be copied with a pre-written message template

### Join Flow
- Valid invite links show the inviter's name and company information
- Existing users can join directly if logged in
- New users are directed to sign up first, then join
- Expired or revoked links show appropriate error messages

### Admin Management
- View all company invite links in the admin panel (`/{companyId}/admin/manage-people`)
- See link creation date, expiration, and usage statistics
- Revoke active links to prevent further use
- Track which users joined via each link

## Database Schema

The `invite_links` table stores:
- `token`: Unique, unguessable identifier (32+ chars)
- `company_id`: Reference to the target company
- `author_id`: Reference to the link creator
- `expires_at`: Automatic expiration (7 days from creation)
- `use_count`: Number of successful joins
- `is_active`: Whether the link can be used

## API Endpoints

### Queries
- `get_invite_link(token)`: Retrieve invite link details
- `list_invite_links(companyId)`: List all company invite links

### Mutations
- `create_invite_link(companyId)`: Generate new invite link
- `revoke_invite_link(inviteLinkId)`: Deactivate invite link
- `join_company_via_invite_link(token)`: Join company via link

## Security Considerations

- Tokens are cryptographically secure and URL-safe
- Links automatically expire after 7 days
- Links can be manually revoked by admins
- All join attempts are logged for audit trail
- Rate limiting should be applied to join endpoints (TODO)

## Routes

- `/{companyId}/invite-team`: Generate invite links
- `/join/{token}`: Join via invite link
- `/{companyId}/admin/manage-people`: Manage invite links

## Testing

Comprehensive tests are provided:
- Unit tests for InviteLinks context (`app/test/operately/invite_links_test.exs`)
- API tests for queries and mutations (`app/test/operately_web/api/`)
- Feature tests for end-to-end flows (`app/test/features/invite_links_test.exs`)

## Future Enhancements

- Rate limiting on join endpoints
- Custom expiration times
- Usage limits per link
- Email notifications for successful joins
- Integration with trusted email domains
- Analytics on invite link performance