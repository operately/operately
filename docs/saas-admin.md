# Saas Admin Panel

The Saas Admin Panel is a web-based interface that allows you to manage the
Saas version of Operately. It provides a dashboard where you can view a list
of registered companies. All the data accessible through the admin panel is
anonymized and does not contain any personal information.

### Promoting a user account to an admin account

To promote a user account to an admin account, you need to have access to the
application console. In the console, run the following command:

```bash
account = Operately.People.get_account_by_email(<email>)
Operately.People.Account.promote_to_admin(account)
```
