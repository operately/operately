defmodule OperatelyEE.AdminApi.Mutations.SendTestEmailTest do
  use OperatelyWeb.TurboCase

  import Mock

  alias Operately.People.Account

  setup do
    original_notification_email = Application.get_env(:operately, :notification_email)

    on_exit(fn ->
      if is_nil(original_notification_email) do
        Application.delete_env(:operately, :notification_email)
      else
        Application.put_env(:operately, :notification_email, original_notification_email)
      end
    end)

    :ok
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :send_test_email, %{})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :send_test_email, %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "returns error when email is not configured", ctx do
      with_mock OperatelyEmail.Mailers.Config.Db, [config: fn -> :not_configured end] do
        assert {200, %{success: false, error: "Email settings are not configured"}} = admin_mutation(ctx.conn, :send_test_email, %{
          recipient: "person@example.com",
          subject: "Test",
          body: "Hello"
        })
      end
    end

    test "returns error when notification email is missing", ctx do
      Application.delete_env(:operately, :notification_email)

      with_mock OperatelyEmail.Mailers.Config.Db, [config: fn -> {:ok, []} end] do
        assert {200, %{success: false, error: "Notification email address is not configured"}} = admin_mutation(ctx.conn, :send_test_email, %{
          recipient: "person@example.com",
          subject: "Test",
          body: "Hello"
        })
      end
    end

    test "delivers a test email", ctx do
      Application.put_env(:operately, :notification_email, "noreply@operately.test")

      with_mocks([
        {OperatelyEmail.Mailers.Config.Db, [], [config: fn -> {:ok, [adapter: Swoosh.Adapters.Test]} end]},
        {Operately.Mailer, [], [deliver: fn _email, _config -> {:ok, %{}} end]}
      ]) do
        assert {200, %{success: true}} = admin_mutation(ctx.conn, :send_test_email, %{
          recipient: "person@example.com",
          subject: "Test",
          body: "Hello"
        })
      end
    end

    test "returns formatted error when delivery fails", ctx do
      Application.put_env(:operately, :notification_email, "noreply@operately.test")

      with_mocks([
        {OperatelyEmail.Mailers.Config.Db, [], [config: fn -> {:ok, []} end]},
        {Operately.Mailer, [], [deliver: fn _email, _config -> {:error, %{message: "boom"}} end]}
      ]) do
        assert {200, %{success: false, error: "boom"}} = admin_mutation(ctx.conn, :send_test_email, %{
          recipient: "person@example.com",
          subject: "Test",
          body: "Hello"
        })
      end
    end
  end
end
