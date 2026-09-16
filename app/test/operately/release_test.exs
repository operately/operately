defmodule Operately.ReleaseTest do
  use Operately.DataCase

  test "seed_preview creates the demo account and company once" do
    previous = Application.get_env(:operately, :demo_builder_allowed)
    Application.put_env(:operately, :demo_builder_allowed, true)

    on_exit(fn ->
      if previous == nil do
        Application.delete_env(:operately, :demo_builder_allowed)
      else
        Application.put_env(:operately, :demo_builder_allowed, previous)
      end
    end)

    refute Operately.Setup.configured?()

    System.put_env("PREVIEW_DEMO_EMAIL", "demo@operately.dev")
    System.put_env("PREVIEW_DEMO_PASSWORD", "preview-demo-1")
    System.put_env("PREVIEW_DEMO_NAME", "Sam Reed")
    System.put_env("PREVIEW_DEMO_COMPANY", "Acme Inc.")

    Operately.Release.seed_preview()

    assert Operately.Setup.configured?()
    assert Operately.Companies.count_companies() == 1
    assert Operately.People.count_accounts() == 1

    account = Operately.Repo.get_by(Operately.People.Account, email: "demo@operately.dev")
    assert account.full_name == "Sam Reed"
    assert account.site_admin

    Operately.Release.seed_preview()
    assert Operately.Companies.count_companies() == 1
    assert Operately.People.count_accounts() == 1
  end
end
