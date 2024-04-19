# Developer's Certificate of Origin

Any contributions to Operately must only contain code that can legally be contributed to Daytona, 
and which the Operately project can distribute under its license.

Prior to contributing to Operately please read the [Developer's Certificate of Origin](/docs/legal/developer_certificate_of_origin.txt)
and sign-off all commits with the `--signoff` option provided by `git commit`. 

For example:

```
git commit --signoff --message "This is the commit message"
```

This will add a `Signed-off-by` trailer to the end of the commit log message.

### Adding signoff option to your ~/.gitconfig

To automatically signoff every commit, put the following in your `~/.gitconfig`:

```
[user]
  email = <YOUR_EMAIL>
  name = <YOUR FULL NAME>
  
[format]
  signOff = true
```
