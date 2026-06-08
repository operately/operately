defmodule Operately.Operations.AccountSigningUpTest do
  use Operately.DataCase

  alias Operately.Operations.AccountSigningUp
  alias Operately.Activities.Activity
  alias Operately.Billing
  alias Operately.People
  alias Operately.People.EmailActivationCode
  alias Operately.Support.Factory

  @email "newuser@example.com"
  @full_name "New User"
  @password "password1234"

  setup do
    previous = Application.get_env(:operately, :allow_signup_with_email)
    Application.put_env(:operately, :allow_signup_with_email, true)

    on_exit(fn -> Application.put_env(:operately, :allow_signup_with_email, previous) end)

    :ok
  end

  describe "successful signup" do
    test "creates an account and returns it with an empty invite context" do
      {:ok, activation} = EmailActivationCode.create(@email)

      assert {:ok, account, invite_context} =
               AccountSigningUp.run(@full_name, @email, @password, activation.code)

      assert account.email == @email
      assert account.full_name == @full_name
      assert People.get_account_by_email(@email)

      assert invite_context == %{company: nil, person: nil, error: nil, join_error_details: nil}
    end

    test "accepts a hyphenated code (e.g. A1B-2C3)" do
      {:ok, activation} = EmailActivationCode.create(@email)

      hyphenated = String.slice(activation.code, 0, 3) <> "-" <> String.slice(activation.code, 3, 3)

      assert {:ok, account, _invite_context} =
               AccountSigningUp.run(@full_name, @email, @password, hyphenated)

      assert account.email == @email
    end

    test "consumes the activation code after a successful signup" do
      {:ok, activation} = EmailActivationCode.create(@email)

      assert {:ok, _account, _invite_context} =
               AccountSigningUp.run(@full_name, @email, @password, activation.code)

      assert Operately.Repo.get(EmailActivationCode, activation.id) == nil
    end

    test "joins a company when a valid invite token is provided" do
      ctx = Factory.setup(%{}) |> Factory.add_company_member(:creator)

      {:ok, invite_link} =
        Operately.InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      {:ok, activation} = EmailActivationCode.create(@email)

      assert {:ok, _account, invite_context} =
               AccountSigningUp.run(@full_name, @email, @password, activation.code, invite_link.token)

      assert invite_context.company.id == ctx.company.id
      assert invite_context.person.email == @email
      assert invite_context.error == nil

      activity = from(a in Activity, where: a.action == "company_member_joined" and a.author_id == ^invite_context.person.id) |> Repo.one()

      assert activity.content["company_id"] == ctx.company.id
      assert activity.content["person_id"] == invite_context.person.id
    end

    test "succeeds but sets invite error when invite token is invalid" do
      {:ok, activation} = EmailActivationCode.create(@email)

      assert {:ok, _account, invite_context} =
               AccountSigningUp.run(@full_name, @email, @password, activation.code, "bad-token")

      assert invite_context.company == nil
      assert invite_context.person == nil
      assert invite_context.error =~ "Invalid invite link"
    end

    test "succeeds but returns structured join error details when the company is full" do
      ctx = Factory.setup(%{}) |> Factory.add_company_member(:creator)
      company = enable_billing(ctx.company)
      fill_company_to_member_limit(company)

      {:ok, invite_link} =
        Operately.InviteLinks.create_invite_link(%{
          company_id: company.id,
          author_id: ctx.creator.id
        })

      {:ok, activation} = EmailActivationCode.create(@email)

      assert {:ok, _account, invite_context} =
               AccountSigningUp.run(@full_name, @email, @password, activation.code, invite_link.token)

      assert invite_context.company == nil
      assert invite_context.person == nil
      assert invite_context.error ==
               "This company has reached its member limit: 20 of 20 active members. Adding or restoring people is blocked until this company is back within its plan limits."
      assert invite_context.join_error_details.code == "member_count_limit_exceeded"
      assert invite_context.join_error_details.limit_key == "member_count"
      assert invite_context.join_error_details.plan_key == "free"
    end
  end

  describe "failure cases" do
    test "returns signup_not_allowed when email signup is disabled" do
      Application.put_env(:operately, :allow_signup_with_email, false)

      assert {:error, :signup_not_allowed} =
               AccountSigningUp.run(@full_name, @email, @password, "ABCDEF")
    end

    test "returns email_taken when the email is already registered" do
      {:ok, activation} = EmailActivationCode.create(@email)
      {:ok, _existing, _} = AccountSigningUp.run(@full_name, @email, @password, activation.code)

      {:ok, activation2} = EmailActivationCode.create(@email)

      assert {:error, :email_taken} =
               AccountSigningUp.run(@full_name, @email, @password, activation2.code)
    end

    test "returns invalid_code when code is nil" do
      assert {:error, :invalid_code} = AccountSigningUp.run(@full_name, @email, @password, nil)
    end

    test "returns invalid_code when code has wrong length" do
      assert {:error, :invalid_code} = AccountSigningUp.run(@full_name, @email, @password, "AB")
    end

    test "returns not_found when no matching activation record exists" do
      assert {:error, :not_found} =
               AccountSigningUp.run(@full_name, @email, @password, "ZZZZZZ")
    end

    test "returns invalid when the activation code has expired" do
      {:ok, activation} = EmailActivationCode.create(@email)

      activation
      |> Ecto.Changeset.change(expires_at: DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.add(-1, :second))
      |> Operately.Repo.update!()

      assert {:error, :invalid} =
               AccountSigningUp.run(@full_name, @email, @password, activation.code)
    end
  end

  defp enable_billing(company) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

    {:ok, company} = Operately.Companies.enable_experimental_feature(company, "billing")
    Billing.create_product(%{
      provider: "polar",
      plan_family: "team",
      billing_interval: "monthly",
      polar_product_id: "signup-team-monthly-#{company.id}",
      active: true
    })

    company
  end

  defp fill_company_to_member_limit(company) do
    needed_people = max(20 - Billing.active_member_count(company), 0)

    if needed_people > 0 do
      Enum.each(1..needed_people, fn index ->
        Operately.PeopleFixtures.person_fixture_with_account(%{
          company_id: company.id,
          full_name: "Signup Limit #{index}",
          email: "signup-limit-#{index}@example.com"
        })
      end)
    end
  end
end
