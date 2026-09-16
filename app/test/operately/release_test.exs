defmodule Operately.ReleaseTest do
  use Operately.DataCase

  alias Operately.{Companies, People}
  alias Operately.People.Account

  @demo_env %{
    "PREVIEW_DEMO_EMAIL" => "demo@operately.dev",
    "PREVIEW_DEMO_PASSWORD" => "preview-demo-1",
    "PREVIEW_DEMO_NAME" => "Sam Reed",
    "PREVIEW_DEMO_COMPANY" => "Acme Inc."
  }

  setup do
    previous_demo_builder_allowed = Application.get_env(:operately, :demo_builder_allowed)
    Application.put_env(:operately, :demo_builder_allowed, true)

    previous_env = Map.new(@demo_env, fn {key, _} -> {key, System.get_env(key)} end)
    System.put_env(@demo_env)

    on_exit(fn ->
      if previous_demo_builder_allowed == nil do
        Application.delete_env(:operately, :demo_builder_allowed)
      else
        Application.put_env(:operately, :demo_builder_allowed, previous_demo_builder_allowed)
      end

      Enum.each(previous_env, fn
        {key, nil} -> System.delete_env(key)
        {key, value} -> System.put_env(key, value)
      end)
    end)

    :ok
  end

  describe "seed_preview/0" do
    test "creates an admin account and a demo company" do
      refute Operately.Setup.configured?()

      Operately.Release.seed_preview()

      assert Operately.Setup.configured?()
      assert Companies.count_companies() == 1

      account = Repo.get_by(Account, email: "demo@operately.dev")
      assert account.full_name == "Sam Reed"
      assert account.site_admin

      # The demo company brings its own members, so the seeded account is one of many.
      assert People.count_accounts() > 1
    end

    test "is a no-op once a company exists" do
      Operately.Release.seed_preview()

      companies = Companies.count_companies()
      accounts = People.count_accounts()

      Operately.Release.seed_preview()

      assert Companies.count_companies() == companies
      assert People.count_accounts() == accounts
    end
  end
end
