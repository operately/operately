defmodule OperatelyWeb.Api.Mutations.CreateAccountTest do
  use OperatelyWeb.TurboCase

  alias Operately.InviteLinks
  alias Operately.People
  alias Operately.Support.Factory

  setup ctx do
    original_value = Application.get_env(:operately, :allow_signup_with_email)
    Application.put_env(:operately, :allow_signup_with_email, true)

    on_exit(fn ->
      Application.put_env(:operately, :allow_signup_with_email, original_value)
    end)

    ctx |> Factory.setup()
  end

  describe "create_account with invite_token" do
    test "creates account and person when valid invite token is provided", ctx do
      # Create an invite link
      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      # Create email activation code
      {:ok, activation} = Operately.People.EmailActivationCode.create("newuser@test.com")

      # Prepare inputs
      inputs = %{
        invite_token: invite_link.token,
        code: activation.code,
        email: "newuser@test.com",
        password: "password1234",
        full_name: "New User"
      }

      # Call the mutation
      assert {200, result} = mutation(ctx.conn, [:create_account], inputs)
      assert result.error == nil
      assert result.person.email == "newuser@test.com"
      assert result.person.full_name == "New User"

      # Verify person was created
      people = People.list_people(ctx.company.id)
      new_person = Enum.find(people, fn p -> p.email == "newuser@test.com" end)

      assert new_person.full_name == "New User"
      assert new_person.company_id == ctx.company.id

      # Verify invite link use count was incremented
      {:ok, updated_invite_link} = InviteLinks.get_invite_link_by_token(invite_link.token)
      assert updated_invite_link.use_count == 1
    end

    test "creates account but no person when invalid invite token is provided", ctx do
      # Create email activation code
      {:ok, activation} = Operately.People.EmailActivationCode.create("newuser2@test.com")

      # Prepare inputs with invalid token
      inputs = %{
        invite_token: "invalid-token-123",
        code: activation.code,
        email: "newuser2@test.com",
        password: "password1234",
        full_name: "New User 2"
      }

      # Call the mutation
      assert {200, result} = mutation(ctx.conn, [:create_account], inputs)
      assert result.error == "Invalid invite link"
      assert result.company == nil
      assert result.person == nil

      # Verify no person was created in the company
      people = People.list_people(ctx.company.id)
      new_person = Enum.find(people, fn p -> p.email == "newuser2@test.com" end)
      assert new_person == nil

      # But account should still exist (we can't easily test this without more setup)
    end

    test "creates account but no person when expired invite token is provided", ctx do
      # Create an expired invite link
      expired_time = DateTime.add(DateTime.utc_now(), -1, :day)

      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          expires_at: expired_time
        })

      # Create email activation code
      {:ok, activation} = Operately.People.EmailActivationCode.create("newuser3@test.com")

      # Prepare inputs
      inputs = %{
        invite_token: invite_link.token,
        code: activation.code,
        email: "newuser3@test.com",
        password: "password1234",
        full_name: "New User 3"
      }

      # Call the mutation
      assert {200, result} = mutation(ctx.conn, [:create_account], inputs)
      assert result.error == "This invite link has expired"
      assert result.company == nil
      assert result.person == nil

      # Verify no person was created in the company
      people = People.list_people(ctx.company.id)
      new_person = Enum.find(people, fn p -> p.email == "newuser3@test.com" end)
      assert new_person == nil

      # Verify invite link use count was not incremented
      {:ok, updated_invite_link} = InviteLinks.get_invite_link_by_token(invite_link.token)
      assert updated_invite_link.use_count == 0
    end

    test "creates account and no person when no invite token is provided", ctx do
      # Create email activation code
      {:ok, activation} = Operately.People.EmailActivationCode.create("newuser4@test.com")

      # Prepare inputs without invite token
      inputs = %{
        code: activation.code,
        email: "newuser4@test.com",
        password: "password1234",
        full_name: "New User 4"
      }

      # Call the mutation
      assert {200, result} = mutation(ctx.conn, [:create_account], inputs)
      assert result.error == nil
      assert result.company == nil
      assert result.person == nil

      # Verify no person was created in the company
      people = People.list_people(ctx.company.id)
      new_person = Enum.find(people, fn p -> p.email == "newuser4@test.com" end)
      assert new_person == nil
    end
  end
end
