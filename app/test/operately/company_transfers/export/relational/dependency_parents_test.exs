defmodule Operately.CompanyTransfers.Export.Relational.DependencyParentsTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Export.Relational.{DependencyParents, SchemaSnapshot}
  alias Operately.CompanyTransfers.Package.Paths
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.Repo

  setup do
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
    {:ok, Factory.setup(%{})}
  end

  test "collects only directly referenced accounts from owned rows", ctx do
    other_ctx = Factory.setup(%{})
    schema = SchemaSnapshot.load()

    owned_rows = %{
      "people" => [
        %{
          "id" => ctx.creator.id,
          "account_id" => ctx.account.id
        }
      ]
    }

    dependency_rows = DependencyParents.collect(schema, owned_rows)
    account_ids = Enum.map(dependency_rows["accounts"], & &1["id"])

    assert account_ids == [ctx.account.id]
    refute other_ctx.account.id in account_ids
  end

  test "expands dependency-parent children such as subscriptions", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    schema = SchemaSnapshot.load()

    subscription_list =
      Repo.insert!(
        SubscriptionList.changeset(%{
          parent_id: ctx.project.id,
          parent_type: :project,
          send_to_everyone: false
        })
      )

    subscription =
      Repo.insert!(
        Subscription.changeset(%{
          type: :joined,
          subscription_list_id: subscription_list.id,
          person_id: ctx.creator.id,
          canceled: false
        })
      )

    owned_rows = %{
      "projects" => [
        %{
          "id" => ctx.project.id,
          "subscription_list_id" => subscription_list.id
        }
      ]
    }

    dependency_rows = DependencyParents.collect(schema, owned_rows)

    assert Enum.map(dependency_rows["subscription_lists"], & &1["id"]) == [subscription_list.id]
    assert Enum.map(dependency_rows["subscriptions"], & &1["id"]) == [subscription.id]
  end

  test "ignores duplicate dependency references while still expanding children", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    schema = SchemaSnapshot.load()

    subscription_list =
      Repo.insert!(
        SubscriptionList.changeset(%{
          parent_id: ctx.project.id,
          parent_type: :project,
          send_to_everyone: false
        })
      )

    subscription =
      Repo.insert!(
        Subscription.changeset(%{
          type: :mentioned,
          subscription_list_id: subscription_list.id,
          person_id: ctx.creator.id,
          canceled: false
        })
      )

    owned_rows = %{
      "projects" => [
        %{"id" => ctx.project.id, "subscription_list_id" => subscription_list.id},
        %{"id" => Ecto.UUID.generate(), "subscription_list_id" => subscription_list.id}
      ]
    }

    dependency_rows = DependencyParents.collect(schema, owned_rows)

    assert Enum.map(dependency_rows["subscription_lists"], & &1["id"]) == [subscription_list.id]
    assert Enum.map(dependency_rows["subscriptions"], & &1["id"]) == [subscription.id]
  end

  test "ignores nil dependency references", _ctx do
    schema = SchemaSnapshot.load()

    owned_rows = %{
      "people" => [
        %{"id" => Ecto.UUID.generate(), "account_id" => nil}
      ]
    }

    assert DependencyParents.collect(schema, owned_rows) == %{}
  end
end
