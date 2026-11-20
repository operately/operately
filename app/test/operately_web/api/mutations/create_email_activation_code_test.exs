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

  describe "create_email_activation_code" do
    test "rejects the oversized signup email without persisting or sending a code", ctx do
      email = "  " <> String.duplicate("a", 300) <> "@example.com  "

      assert {400, result} = mutation(ctx.conn, :create_email_activation_code, %{email: email})
      assert result.message == "Enter an email address with no more than 255 characters."
      assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 0
      assert_no_email_sent()
    end

    test "translates oversized-email validation messages", ctx do
      email = String.duplicate("a", 244) <> "@example.com"

      Gettext.with_locale(OperatelyWeb.Gettext, "de", fn ->
        assert {:error, :bad_request, "Gib eine E-Mail-Adresse mit höchstens 255 Zeichen ein."} =
                 OperatelyWeb.Api.Mutations.CreateEmailActivationCode.call(ctx.conn, %{email: email})
      end)
    end

    test "creates activation code and sends email when email delivery is configured", ctx do
      inputs = %{email: "newuser@test.com"}

      assert {200, result} = mutation(ctx.conn, :create_email_activation_code, inputs)
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

      assert {400, result} = mutation(ctx.conn, :create_email_activation_code, inputs)
      assert result.error == "Bad request"
      assert result.message == "Email signup isn't available because email delivery hasn't been configured. Please contact your organization administrator."

      # Verify no activation code was created
      code = Repo.get_by(Operately.People.EmailActivationCode, email: "newuser@test.com")
      assert code == nil
    end

    test "handles multiple activation codes for different emails", ctx do
      inputs1 = %{email: "user1@test.com"}
      inputs2 = %{email: "user2@test.com"}

      assert {200, _} = mutation(ctx.conn, :create_email_activation_code, inputs1)
      assert {200, _} = mutation(ctx.conn, :create_email_activation_code, inputs2)

      code1 = Repo.get_by(Operately.People.EmailActivationCode, email: "user1@test.com")
      code2 = Repo.get_by(Operately.People.EmailActivationCode, email: "user2@test.com")

      assert code1 != nil
      assert code2 != nil
      assert code1.code != code2.code
    end

    test "blocks repeated requests for the same email during the cooldown", ctx do
      inputs = %{email: "user@test.com"}

      assert {200, _} = mutation(ctx.conn, :create_email_activation_code, inputs)
      assert_email_sent(to: inputs.email)
      assert {400, result} = mutation(ctx.conn, :create_email_activation_code, %{email: " USER@test.com "})
      assert result.message == "Please wait before requesting another code."
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
      assert {200, _} = mutation(ctx.conn, :create_email_activation_code, inputs)

      Repo.update_all(Operately.People.EmailActivationCode, set: [inserted_at: DateTime.utc_now() |> DateTime.add(-60, :second) |> DateTime.truncate(:second)])

      assert {200, _} = mutation(ctx.conn, :create_email_activation_code, inputs)
      assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 2
      assert {400, _} = mutation(ctx.conn, :create_email_activation_code, inputs)
    end

    for {label, inputs} <- [{"null", %{email: nil}}, {"missing", %{}}, {"malformed", %{email: "invalid"}}] do
      test "returns a validation error for #{label} email input", ctx do
        assert {400, result} = mutation(ctx.conn, :create_email_activation_code, unquote(Macro.escape(inputs)))
        assert result.message == "Enter a valid email address."
        assert Repo.aggregate(Operately.People.EmailActivationCode, :count) == 0
        assert_no_email_sent()
      end
    end

    test "does not require authentication", ctx do
      # No login, just a plain connection
      inputs = %{email: "anonymous@test.com"}

      assert {200, result} = mutation(ctx.conn, :create_email_activation_code, inputs)
      assert result == %{}
    end
  end

  describe "security" do
    test "returns internal server error when signup is not allowed", ctx do
      Application.put_env(:operately, :allow_signup_with_email, false)

      inputs = %{email: "newuser@test.com"}

      assert {500, result} = mutation(ctx.conn, :create_email_activation_code, inputs)
      assert result.error == "Internal server error"

      # Verify no activation code was created
      code = Repo.get_by(Operately.People.EmailActivationCode, email: "newuser@test.com")
      assert code == nil
    end
  end
end
