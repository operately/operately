# Test Guidelines for Operately

This document provides comprehensive guidance for writing and running tests in the Operately codebase.

## Running Tests - CRITICAL COMMANDS

### Single Test File Execution

**✅ CORRECT:** Use the generic `make test` target with FILE parameter

```bash
make test FILE=test/features/project_check_ins_test.exs
make test FILE=test/operately/projects_test.exs
make test FILE=test/operately_web/controllers/api/projects_controller_test.exs
```

**✅ CORRECT:** You can specify the line where the test is

```bash
make test FILE=test/features/project_check_ins_test.exs:21
make test FILE=test/operately/projects_test.exs:100
make test FILE=test/operately_web/controllers/api/projects_controller_test.exs:11
```

**❌ INCORRECT:** Do NOT use these patterns

```bash
# NEVER use INDEX/TOTAL with specific FILE
INDEX=1 TOTAL=1 make test.mix.features FILE=app/test/features/project_check_ins_test.exs

# NEVER call mix test directly
mix test test/features/project_check_ins_test.exs

# NEVER use make test.mix.features with FILE parameter
make test.mix.features FILE=test/features/project_check_ins_test.exs
```

## Test Types and Structure

### Unit Tests

Location: `app/test/` (excluding `features/` directory)

- Business logic tests in `test/operately/`
- Web layer tests in `test/operately_web/`
- Support module tests in `test/support/`

**Characteristics:**

- Fast execution (< 1 second per test)
- Test individual functions/modules in isolation
- No browser automation (no Wallaby)
- Use `Operately.DataCase` for database tests
- Use `Operately.ConnCase` for controller tests

### Feature Tests

Location: `app/test/features/`

- End-to-end browser automation tests
- Use Wallaby for browser interaction
- Test complete user workflows

**Characteristics:**

- Slower execution (5-30 seconds per test)
- Test full user scenarios
- Use browser automation (Wallaby)
- Use `Operately.FeatureCase`
- Follow step-based pattern with `feature` macro

### Factory Pattern (REQUIRED)

**✅ CORRECT: Use Factory System**

```elixir
defmodule Operately.ProjectsTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})  # Creates account, company, creator
  end

  test "project creation", ctx do
    ctx
    |> Factory.add_space(:marketing)
    |> Factory.add_project(:website, :marketing)
    |> Factory.add_company_member(:john)
    |> Factory.add_project_contributor(:john_contrib, :website)

    # All entities are properly related and accessible
    assert ctx.website.space_id == ctx.marketing.id
    assert ctx.john.company_id == ctx.company.id
  end
end
```

**✅ CORRECT: Feature Test Pattern**

```elixir
defmodule Operately.Features.ProjectCreationTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.given_a_space_exists()
    |> Steps.log_in_as_space_member()
  end

  feature "creating a new project", ctx do
    ctx
    |> Steps.visit_projects_page()
    |> Steps.click_new_project_button()
    |> Steps.fill_project_form(%{name: "New Project", description: "Test project"})
    |> Steps.submit_project_form()
    |> Steps.assert_project_created()
    |> Steps.assert_project_visible_in_list()
  end
end
```

**❌ INCORRECT: Direct Fixture Usage (DO NOT USE)**

```elixir
# NEVER use this pattern - requires manual relationship setup
company = company_fixture()
person = person_fixture(%{company_id: company.id})
space = group_fixture(person, %{company_id: company.id})
project = project_fixture(%{group_id: space.id, creator_id: person.id})
```

Factories are located in app/test/support/factory.ex

## Test File Organization

```
app/test/
├── features/                    # Feature tests (end-to-end)
│   ├── project_check_ins_test.exs
│   ├── goal_creation_test.exs
│   └── ...
├── operately/                   # Business logic tests
│   ├── projects_test.exs
│   ├── goals_test.exs
│   └── ...
├── operately_web/              # Web layer tests
│   ├── controllers/
│   ├── graphql/
│   └── ...
├── support/                    # Test support modules
│   ├── factory.ex              # Main factory
│   ├── feature_case.ex         # Feature test setup
│   ├── data_case.ex           # Data test setup
│   └── features/              # Feature test steps
└── test_helper.exs            # Test configuration
```

## Feature Test Step Pattern

Feature tests use a step-based pattern with descriptive method names:

```elixir
defmodule Operately.Support.Features.ProjectSteps do
  use Operately.FeatureSteps

  step :given_a_space_exists, ctx do
    ctx |> Factory.add_space(:default_space)
  end

  step :visit_projects_page, ctx do
    ctx |> UI.visit("/spaces/#{ctx.default_space.id}/projects")
  end

  step :click_new_project_button, ctx do
    ctx |> UI.click(testid("new-project-button"))
  end

  step :assert_project_created, ctx do
    ctx |> UI.assert_text("Project created successfully")
  end
end
```

### Testing Email Delivery

```elixir
test "sends notification email", ctx do
  # Perform action that should send email
  {:ok, _} = Operately.Projects.create_project(ctx.creator, attrs)

  # Assert email was sent
  assert_email_sent(fn email ->
    assert email.to == [ctx.reviewer.email]
    assert email.subject =~ "New project created"
  end)
end
```

### Screenshots for Feature Tests

Feature tests automatically capture screenshots on failure in `app/screenshots/`

### Database Cleanup

Tests automatically clean up via database transactions. No manual cleanup needed.

## Migration Testing

When adding database migrations, test them:

```bash
make test.db.reset    # Reset test database
make test.db.migrate  # Run migrations
make test.mix         # Verify tests still pass
```

## Common Pitfalls

1. **Don't call `mix test` directly** - Always use `make test FILE=<path>`
2. **Don't use INDEX/TOTAL for single files** - That's only for parallel execution
3. **Don't use fixtures directly** - Always use the Factory system
4. **Don't forget Factory.setup(%{})** - Required for proper test environment
5. **Don't mix sync and async database tests** - Can cause conflicts
6. **Don't hardcode IDs** - Use factory-generated entities
7. **Don't test implementation details** - Test behavior and outcomes

## CI Integration

Tests run automatically on pull requests. Key checks:

- Unit tests: `make test.mix.unit`
- Feature tests: `make test.mix.features` (parallel)
- JavaScript tests: `make test.npm`
- Enterprise tests: `make test.ee`

All test commands respect the same FILE parameter pattern for consistency.
