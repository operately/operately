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
  @password "Password1234"

  setup do
    previous = Application.get_env(:operately, :allow_signup_with_email)
    Application.put_env(:operately, :allow_signup_with_email, true)

    on_exit(fn -> Application.put_env(:operately, :allow_signup_with_email, previous) end)

    :ok
  end

  test "email signup preserves the context bound to the verification record" do
    previous = Application.get_env(:operately, :conversion_analytics)
    Application.put_env(:operately, :conversion_analytics, enabled: true, token: "test")
    on_exit(fn -> Application.put_env(:operately, :conversion_analytics, previous) end)
    Oban.Testing.with_testing_mode(:manual, fn ->
      anonymous_id = Ecto.UUID.generate()
      {:ok, activation} = EmailActivationCode.create(@email, %{anonymous_id: anonymous_id, attribution: %{"utm_source" => "email-test"}})
      {:ok, account, _} = AccountSigningUp.run(@full_name, @email, @password, activation.code, nil, %{channel: "web", attribution: %{"utm_source" => "wrong"}})
      state = Repo.get!(Operately.Analytics.AccountState, account.id)
      assert state.attribution == %{"utm_source" => "email-test"}
      jobs = Repo.all(from j in Oban.Job, where: j.worker == "Operately.Analytics.Delivery")
      assert Enum.sort(Enum.map(jobs, & &1.args["event"]["event"])) == ["$identify", "signup_completed"]
      assert Enum.find(jobs, &(&1.args["event"]["event"] == "$identify")).args["event"]["properties"]["$anon_distinct_id"] == anonymous_id
    end)
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

      {:ok, invite_link} =
        Operately.InviteLinks.create_invite_link(%{
          company_id: company.id,
          author_id: ctx.creator.id
        })

      assert {:ok, @email} = AccountSigningUp.preflight(%{email: @email, full_name: @full_name, password: @password, invite_token: invite_link.token})
      {:ok, activation} = EmailActivationCode.create(@email)
      fill_company_to_member_limit(company)

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

      assert {:error, %Ecto.Changeset{}} =
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

  test "failed validation preserves a code for corrected details" do
    {:ok, activation} = EmailActivationCode.create(@email)
    assert {:error, %Ecto.Changeset{}} = AccountSigningUp.run("", @email, @password, activation.code)
    assert Repo.get(EmailActivationCode, activation.id)
    refute People.get_account_by_email(@email)
    assert {:ok, account, _} = AccountSigningUp.run("  Corrected Name  ", "  NEWUSER@EXAMPLE.COM  ", @password, activation.code)
    assert account.full_name == "Corrected Name"
    assert account.email == @email
    refute Repo.get(EmailActivationCode, activation.id)
  end

  test "signup availability is checked again after delivery" do
    {:ok, activation} = EmailActivationCode.create(@email)
    Application.put_env(:operately, :allow_signup_with_email, false)
    assert {:error, :signup_not_allowed} = AccountSigningUp.run(@full_name, @email, @password, activation.code)
    assert Repo.get(EmailActivationCode, activation.id)
  end

  test "a revoked invitation after preflight preserves account creation but prevents membership" do
    ctx = Factory.setup(%{})
    {:ok, invite} = Operately.InviteLinks.create_invite_link(%{company_id: ctx.company.id, author_id: ctx.creator.id})
    attrs = %{full_name: @full_name, email: @email, password: @password, invite_token: invite.token}
    assert {:ok, @email} = AccountSigningUp.preflight(attrs)
    {:ok, activation} = EmailActivationCode.create(@email)
    {:ok, _} = Operately.InviteLinks.revoke_invite_link(invite)
    assert {:ok, account, %{person: nil, error: error}} = AccountSigningUp.run(@full_name, @email, @password, activation.code, invite.token)
    assert error
    assert Repo.get(Operately.People.Account, account.id)
    refute Repo.get(EmailActivationCode, activation.id)
    refute People.get_person(account, ctx.company)
  end

  test "a database uniqueness failure after validation rolls back consumption and permits retry" do
    {:ok, activation} = EmailActivationCode.create(@email)
    # Emulate a uniqueness conflict at insertion, after the availability query.
    Repo.query!("""
    CREATE FUNCTION reject_signup_email() RETURNS trigger AS $$
    BEGIN
      RAISE unique_violation USING CONSTRAINT = 'accounts_email_index';
    END;
    $$ LANGUAGE plpgsql
    """)

    Repo.query!("CREATE TRIGGER reject_signup_email BEFORE INSERT ON accounts FOR EACH ROW EXECUTE FUNCTION reject_signup_email()")
    jobs_before = Repo.aggregate(Oban.Job, :count)
    assert {:error, %Ecto.Changeset{} = changeset} = AccountSigningUp.run(@full_name, @email, @password, activation.code)
    assert changeset.errors[:email]
    assert Repo.get(EmailActivationCode, activation.id)
    refute People.get_account_by_email(@email)
    assert Repo.aggregate(Oban.Job, :count) == jobs_before
    Repo.query!("DROP TRIGGER reject_signup_email ON accounts")
    Repo.query!("DROP FUNCTION reject_signup_email()")
    assert {:ok, _, _} = AccountSigningUp.run(@full_name, @email, @password, activation.code)
  end

  test "an onboarding job failure rolls back the account and code consumption" do
    {:ok, activation} = EmailActivationCode.create(@email)

    Repo.query!("""
    CREATE FUNCTION reject_signup_job() RETURNS trigger AS $$
    BEGIN
      IF NEW.worker = 'OperatelyEE.AccountOnboardingJob' THEN
        RAISE check_violation USING CONSTRAINT = 'priority_range';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
    """)

    Repo.query!("CREATE TRIGGER reject_signup_job BEFORE INSERT ON oban_jobs FOR EACH ROW EXECUTE FUNCTION reject_signup_job()")
    jobs_before = Repo.aggregate(Oban.Job, :count)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:error, :account_creation_failed} = AccountSigningUp.run(@full_name, @email, @password, activation.code)
    end)

    assert Repo.get(EmailActivationCode, activation.id)
    refute People.get_account_by_email(@email)
    assert Repo.aggregate(Oban.Job, :count) == jobs_before
    Repo.query!("DROP TRIGGER reject_signup_job ON oban_jobs")
    Repo.query!("DROP FUNCTION reject_signup_job()")
    assert {:ok, _, _} = AccountSigningUp.run(@full_name, @email, @password, activation.code)
  end

  test "preflight prevents delivery eligibility when a company is full" do
    ctx = Factory.setup(%{})
    company = enable_billing(ctx.company)
    fill_company_to_member_limit(company)
    {:ok, invite} = Operately.InviteLinks.create_invite_link(%{company_id: company.id, author_id: ctx.creator.id})
    assert {:error, {:invitation, %Operately.Billing.EnforceLimits.LimitError{}}} = AccountSigningUp.preflight(%{email: @email, full_name: @full_name, password: @password, invite_token: invite.token})
    assert Operately.InviteLinks.get_invite_link!(invite.id).use_count == 0
  end

  defp enable_billing(company) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

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
