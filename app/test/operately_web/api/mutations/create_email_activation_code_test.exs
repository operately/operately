defmodule OperatelyWeb.Api.Mutations.CreateEmailActivationCodeTest do
  import Ecto.Query, only: [from: 2]
  use OperatelyWeb.TurboCase
  import Swoosh.TestAssertions

  setup ctx do
    original_value = Application.get_env(:operately, :allow_signup_with_email)
    Application.put_env(:operately, :allow_signup_with_email, true)

    on_exit(fn ->
      Application.put_env(:operately, :allow_signup_with_email, original_value)
    end)

    ctx |> Factory.setup()
  end

  @details %{full_name: "New User", password: "ValidPassword123"}

  describe "create_email_activation_code" do
    test "rejects the oversized signup email without persisting or sending a code", ctx do
      email = "  " <> String.duplicate("a", 300) <> "@example.com  "

      assert {400, result} = mutation(ctx.conn, :create_email_activation_code, %{email: email})
      assert result.message == "Enter an email address with no more than 255 characters."
      assert result.details.field == "email"
      assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 0
      assert_no_email_sent()
    end

    test "translates oversized-email validation messages", ctx do
      email = String.duplicate("a", 244) <> "@example.com"

      Gettext.with_locale(OperatelyWeb.Gettext, "de", fn ->
        assert {:error, :bad_request, "Gib eine E-Mail-Adresse mit höchstens 255 Zeichen ein.", %{field: "email"}} =
                 OperatelyWeb.Api.Mutations.CreateEmailActivationCode.call(ctx.conn, %{email: email})
      end)
    end

    test "creates activation code and sends email when email delivery is configured", ctx do
      inputs = %{email: "newuser@test.com"}

      assert {200, result} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, inputs))
      assert result == %{}

      # Verify activation code was created in database
      code = Repo.get_by(Operately.People.EmailActivationCode, email: "newuser@test.com")
      assert code != nil
      assert String.length(code.code) == 6
      assert code.expires_at != nil

      # Verify expiration is approximately 5 minutes from now
      now = DateTime.utc_now()
      diff = DateTime.diff(code.expires_at, now, :second)
      assert diff > 290 and diff < 310
      assert_email_sent(to: "newuser@test.com")
    end

    test "returns error when email delivery is not configured", ctx do
      # Mock email delivery as not configured by setting app_env to :prod
      # and ensuring no email environment variables are set
      original_app_env = Application.get_env(:operately, :app_env)
      original_sendgrid = System.get_env("SENDGRID_API_KEY")
      original_smtp = System.get_env("SMTP_SERVER")

      Application.put_env(:operately, :app_env, :prod)
      System.delete_env("SENDGRID_API_KEY")
      System.delete_env("SMTP_SERVER")

      on_exit(fn ->
        Application.put_env(:operately, :app_env, original_app_env)
        if original_sendgrid, do: System.put_env("SENDGRID_API_KEY", original_sendgrid)
        if original_smtp, do: System.put_env("SMTP_SERVER", original_smtp)
      end)

      inputs = %{email: "newuser@test.com"}

      assert {400, result} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, inputs))
      assert result.error == "Bad request"
      assert result.message == "Email signup isn't available because email delivery hasn't been configured. Please contact your organization administrator."
      refute Map.has_key?(result, :details)

      # Verify no activation code was created
      code = Repo.get_by(Operately.People.EmailActivationCode, email: "newuser@test.com")
      assert code == nil
    end

    test "handles multiple activation codes for different emails", ctx do
      inputs1 = %{email: "user1@test.com"}
      inputs2 = %{email: "user2@test.com"}

      assert {200, _} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, inputs1))
      assert {200, _} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, inputs2))

      code1 = Repo.get_by(Operately.People.EmailActivationCode, email: "user1@test.com")
      code2 = Repo.get_by(Operately.People.EmailActivationCode, email: "user2@test.com")

      assert code1 != nil
      assert code2 != nil
      assert code1.code != code2.code
    end

    test "blocks repeated requests for the same email during the cooldown", ctx do
      inputs = %{email: "user@test.com"}

      assert {200, _} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, inputs))
      assert_email_sent(to: inputs.email)
      assert {400, result} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, %{email: " USER@test.com "}))
      assert result.message == "Please wait before requesting another code."
      refute Map.has_key?(result, :details)
      assert_no_email_sent()

      codes =
        Repo.all(
          from c in Operately.People.EmailActivationCode,
            where: c.email == "user@test.com"
        )

      assert length(codes) == 1
    end

    test "allows another request after the 60-second interval", ctx do
      inputs = %{email: "user@test.com"}
      assert {200, _} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, inputs))

      Repo.update_all(Operately.People.EmailActivationCode, set: [inserted_at: DateTime.utc_now() |> DateTime.add(-60, :second) |> DateTime.truncate(:second)])

      assert {200, _} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, inputs))
      assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 2
      assert {400, _} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, inputs))
    end

    for {label, inputs} <- [{"null", %{email: nil}}, {"missing", %{}}, {"malformed", %{email: "invalid"}}] do
      test "returns a validation error for #{label} email input", ctx do
        assert {400, result} = mutation(ctx.conn, :create_email_activation_code, unquote(Macro.escape(inputs)))
        assert result.message == "Enter a valid email address."
        assert result.details.field == "email"
        assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 0
        assert_no_email_sent()
      end
    end

    test "does not require authentication", ctx do
      # No login, just a plain connection
      inputs = %{email: "anonymous@test.com"}

      assert {200, result} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, inputs))
      assert result == %{}
    end
  end

  test "rejects duplicate email before code delivery", ctx do
    assert {400, result} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, %{email: "  " <> String.upcase(ctx.creator.email) <> "  "}))
    assert result.details.field == "email"
    assert result.message == "Email is already registered"
    assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 0
    assert_no_email_sent()
  end

  for {field, value} <- [{:full_name, nil}, {:full_name, " "}, {:password, nil}, {:password, "weakpassword"}] do
    test "rejects #{field}=#{inspect(value)} before code delivery", ctx do
      inputs = Map.merge(@details, %{email: "valid@example.com"}) |> Map.put(unquote(field), unquote(value))
      assert {400, result} = mutation(ctx.conn, :create_email_activation_code, inputs)
      assert result.details.field == unquote(to_string(field))
      assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 0
      assert_no_email_sent()
    end
  end

  test "email-only requests cannot bypass validation", ctx do
    assert {400, result} = mutation(ctx.conn, :create_email_activation_code, %{email: "valid@example.com"})
    assert result.details.field == "full_name"
    assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 0
    assert_no_email_sent()
  end

  test "normalizes delivery and accepts an email longer than the old 160-character limit", ctx do
    email = String.duplicate("a", 243) <> "@example.com"
    assert {200, _} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, %{email: "  " <> String.upcase(email) <> "  "}))
    assert Repo.get_by(Operately.People.EmailActivationCode, email: email)
    assert_email_sent(to: email)
  end

  test "invalid and inactive invitations send no code or create membership", ctx do
    {:ok, invite} = Operately.InviteLinks.create_invite_link(%{company_id: ctx.company.id, author_id: ctx.creator.id, is_active: false})
    people_before = Repo.aggregate(Operately.People.Person, :count)

    for token <- ["missing", invite.token] do
      assert {400, result} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, %{email: "valid@example.com", invite_token: token}))
      assert result.details.field == "invite_token"
    end

    assert Repo.aggregate(Operately.People.Person, :count) == people_before
    assert Operately.InviteLinks.get_invite_link!(invite.id).use_count == 0
    assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 0
    assert_no_email_sent()
  end

  test "domain restrictions and personal invitations are checked before delivery", ctx do
    {:ok, restricted} = Operately.InviteLinks.create_invite_link(%{company_id: ctx.company.id, author_id: ctx.creator.id, allowed_domains: ["company.com"]})
    {:ok, personal} = Operately.InviteLinks.create_personal_invite_link(%{company_id: ctx.company.id, author_id: ctx.creator.id, person_id: ctx.creator.id})

    for {token, details} <- [{restricted.token, %{field: "email", reason: "invite_link_domain_not_allowed"}}, {personal.token, %{field: "invite_token"}}] do
      assert {400, result} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, %{email: "valid@example.com", invite_token: token}))
      assert result.details == details
    end

    assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 0
    assert_no_email_sent()
  end

  test "directs an existing personal invite recipient to sign in", ctx do
    {:ok, invite} = Operately.InviteLinks.create_personal_invite_link(%{company_id: ctx.company.id, author_id: ctx.creator.id, person_id: ctx.creator.id})
    inputs = Map.merge(@details, %{email: ctx.creator.email, invite_token: invite.token})
    assert {400, result} = mutation(ctx.conn, :create_email_activation_code, inputs)
    assert result.details.field == "invite_token"
    assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 0
    assert_no_email_sent()
  end

  describe "security" do
    test "returns forbidden when signup is not allowed", ctx do
      Application.put_env(:operately, :allow_signup_with_email, false)

      inputs = %{email: "newuser@test.com"}

      assert {403, result} = mutation(ctx.conn, :create_email_activation_code, Map.merge(@details, inputs))
      assert result.error == "Forbidden"
      refute Map.has_key?(result, :details)

      # Verify no activation code was created
      code = Repo.get_by(Operately.People.EmailActivationCode, email: "newuser@test.com")
      assert code == nil
    end
  end
end
