# Setting up AI Agents in localhost

## 1 - Create an API key for Claude

To set up AI agents locally, begin by obtaining an API key from
[console.claude.com](https://console.claude.com). Sign in, navigate to the API
section, and generate a new key.

**ProTip:** Set a budget for your agent in the console dashboard to manage
costs and avoid unexpected usage charges. $5 is a good start.

## 2 - Store the API key into the .env file

Once you have your API key, add it to the `.env` in the root of this project:

```
ANTHROPIC_API_KEY="your-key"
```

## 3 - Restart the app server

After updating the `.env` file, restart your application with `make dev.build` to
ensure the new configuration is loaded. Then, run `make dev.server` to start the server.

## 4 - Configure yourself as the site-admin

In the application console, run the following code:

```
account = Operately.People.get_account_by_email("<your-email>")
Operately.People.Account.promote_to_admin(account)
```

Now, you should be able to visit the admin part of the application:
http://localhost:4000/admin.

## 5 - Enable the 'ai' experimental feature

In the application admin http://localhost:4000/admin, find and click on your company.
Then, click the three dots on the right-top corner -> enable experimental feature.

Enter "ai" and save.

## 6 - Create an agent in your company

Go to your company. In the top navigation -> click on your company -> Company Admin -> Manage AI Agents.
Click on "Add Agent".
