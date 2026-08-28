defmodule Operately.Data.Change115DismissProductReleaseV180Test do
  use Operately.DataCase
  import Ecto.Query

  alias Operately.Data.Change115DismissProductReleaseV180, as: Change
  alias Operately.Data.Change115DismissProductReleaseV180.Person
  alias Operately.Repo
  alias Operately.Support.Factory

  setup ctx do
    Factory.setup(ctx)
  end

  test "run/0 sets dismissed_product_release_id for everyone without changing other preferences" do
    ctx = Factory.setup(%{})
    ctx = Factory.add_company_member(ctx, :member_one)

    set_preferences(ctx.creator.id, %{
      "time_format" => "hour_24",
      "notifications" => %{
        "email_preference" => "buffered",
        "notify_on_mention" => true
      }
    })

    set_preferences(ctx.member_one.id, %{})

    Change.run()

    creator_preferences = fetch_preferences(ctx.creator.id)
    assert creator_preferences["dismissed_product_release_id"] == Change.release_id()
    assert creator_preferences["time_format"] == "hour_24"
    assert creator_preferences["notifications"]["notify_on_mention"] == true

    member_one_preferences = fetch_preferences(ctx.member_one.id)
    assert member_one_preferences["dismissed_product_release_id"] == Change.release_id()
  end

  test "run/0 is idempotent" do
    ctx = Factory.setup(%{})

    set_preferences(ctx.creator.id, %{
      "dismissed_product_release_id" => Change.release_id()
    })

    Change.run()
    Change.run()

    assert fetch_preferences(ctx.creator.id)["dismissed_product_release_id"] == Change.release_id()
  end

  test "dismiss_release/1 replaces an existing dismissed release id" do
    preferences = Change.dismiss_release(%{"dismissed_product_release_id" => "v1.7"})

    assert preferences["dismissed_product_release_id"] == Change.release_id()
  end

  defp set_preferences(person_id, preferences) do
    from(p in Person, where: p.id == ^person_id)
    |> Repo.update_all(set: [preferences: preferences])
  end

  defp fetch_preferences(person_id) do
    from(p in Person, where: p.id == ^person_id, select: p.preferences)
    |> Repo.one!()
  end
end
