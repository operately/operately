# Developer's Certificate of Origin

Any contributions to Operately must only contain code that can legally be contributed to Operately, 
and which the Operately project can distribute under its license.

Prior to contributing to Operately please read the [Developer's Certificate of Origin](/docs/legal/developer_certificate_of_origin.txt)
and sign-off all commits with the `--signoff` option provided by `git commit`. 

For example:

```
git commit --signoff --message "This is the commit message"
```

This will add a `Signed-off-by` trailer to the end of the commit log message.

### Adding an alias command to git that signs off every commit

To automatically signoff every commit, put the following in your `~/.gitconfig`:

```
[user]
  email = <YOUR_EMAIL>
  name = <YOUR FULL NAME>
  
[alias]
  ci = commit -s
```

Use the new `git ci` alias to make commits: `git ci -m "Example commit messages"`.

### Automatic verification of DCO

When you open a Pull-Request, the [Github DCO App](https://github.com/apps/dco) will automatically
check every commit in your pull request.

### Fixing commits that don't have a signed-off message

If you accidentally forgot to sign-off your commits, you can do one of the following:

- For individual commits, do `git commit --amend --no-edit --signoff`.
- Or for multiple commits, start an interactive rebase with the main branch: `git rebase -i main` and make sure to signoff every commit.
