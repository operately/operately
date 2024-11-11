# Experimental Features

Experimental features are features that are not yet fully supported or tested, 
and are subject to change or removal in future versions. This document describes
how to add, using, and enabling experimental features in Operately. 

Experimental features in Operately are company-wide, meaning that they are enabled
for all users in the company. Experimental features are disabled by default. 

Experimental feature in Operately are just a list of strings on the company record.
The strings are the names of the experimental features. There is no special handling
of experimental features in the codebase, other than checking if the name of the
feature is in the list of enabled experimental features.

## Using experimental features in code

The company record in the database has a field called `enabled_experimental_features`
which is a list of enabled experimental features for the company.

To check if an experimental feature is enabled for the company, you can use the 
following code:

```elixir
feature = "my-experimental-feature"
company = Company.get(:system, id: company_id)

if feature in company.enabled_experimental_features do
  # Feature is enabled
else
  # Feature is disabled
end
```

On the client side, you can use the following code to check if an experimental
feature is enabled:

```tsx
const feature = "my-experimental-feature"
const company = useCompany()

if (company.enabledExperimentalFeatures.includes(feature)) {
  // Feature is enabled
} else {
  // Feature is disabled
}
```

## Enabling experimental features

To enable an experimental feature for a company, add the feature to the
`enabled_experimental_features` list in the company record.

```elixir
company = Company.get(:system, id: company_id)

Operately.Companies.enable_experimental_feature(company, "my-experimental-feature")
```
