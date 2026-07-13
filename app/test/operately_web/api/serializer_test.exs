defmodule OperatelyWeb.Api.SerializerTest do
  use Operately.DataCase
  alias OperatelyWeb.Api.Serializer
  alias Operately.Support.Factory

  describe "date and time serialization" do
    test "it serializes naive date time as UTC" do
      {:ok, naive_datetime} = NaiveDateTime.new(2020, 1, 1, 12, 0, 0)

      assert Serializer.serialize(naive_datetime) == "2020-01-01T12:00:00Z"
    end

    test "it serializes DateTime with the timezone" do
      {:ok, datetime} = DateTime.new(~D[2020-01-01], ~T[12:00:00], "Etc/UTC")

      assert Serializer.serialize(datetime) == "2020-01-01T12:00:00Z"
    end
  end

  describe "__typename discriminator" do
    setup do
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space, goal: :goal)
      |> Factory.add_resource_hub(:resource_hub, :space, :creator)
      |> Factory.add_folder(:folder, :resource_hub)
      |> Factory.preload(:project, [:group, :goal])
      |> Factory.preload(:folder, [:node])
      |> Factory.preload(:resource_hub, [:space])
    end

    test "tags core entities", ctx do
      project = Serializer.serialize(ctx.project, level: :essential)
      goal = Serializer.serialize(ctx.goal, level: :essential)
      person = Serializer.serialize(ctx.creator, level: :essential)
      space = Serializer.serialize(ctx.space, level: :essential)

      assert project.__typename == "project"
      assert goal.__typename == "goal"
      assert person.__typename == "person"
      assert space.__typename == "space"
    end

    test "person keeps domain type alongside __typename", ctx do
      person = Serializer.serialize(ctx.creator, level: :essential)

      assert person.__typename == "person"
      assert is_binary(person.type)
      assert person.type != "person"
    end

    test "distinguishes resource hub from folder", ctx do
      hub = Serializer.serialize(ctx.resource_hub, level: :essential)
      folder = Serializer.serialize(ctx.folder, level: :essential)

      assert hub.__typename == "resource_hub"
      assert folder.__typename == "resource_hub_folder"
    end

    test "tags nested associations", ctx do
      project = Serializer.serialize(ctx.project, level: :full)

      assert project.__typename == "project"
      assert project.goal.__typename == "goal"
      assert project.space.__typename == "space"
    end

    test "tags at both essential and full levels", ctx do
      essential = Serializer.serialize(ctx.project, level: :essential)
      full = Serializer.serialize(ctx.project, level: :full)

      assert essential.__typename == "project"
      assert full.__typename == "project"
    end

    test "tags permissions with module overrides", _ctx do
      permissions = Serializer.serialize(%Operately.Projects.Permissions{}, level: :essential)

      assert permissions.__typename == "project_permissions"
    end

    test "does not tag modules without for: registration" do
      kanban = Serializer.serialize(%Operately.Tasks.KanbanState{state: %{}}, level: :essential)

      refute Map.has_key?(kanban, :__typename)
    end
  end

  describe "activity content __typename" do
    setup do
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space)
    end

    test "tags activity envelope and explicit serialize_content maps", ctx do
      activity = %{
        id: Ecto.UUID.generate(),
        inserted_at: NaiveDateTime.utc_now(),
        action: "goal_created",
        author: ctx.creator,
        comment_thread: nil,
        content: %{"goal" => ctx.goal},
        notifications: [],
        permissions: %Operately.Activities.Permissions{
          can_edit_comment_thread: false,
          can_comment_on_thread: false,
          can_view: true,
          can_acknowledge: false
        }
      }

      serialized = OperatelyWeb.Api.Serializers.Activity.serialize(activity, comment_thread: :minimal)

      assert serialized.__typename == "activity"
      assert serialized.content.__typename == "activity_content_goal_created"
      assert serialized.content.goal.__typename == "goal"
    end

    test "tags catch-all content via Serializable registry" do
      content_struct = %Operately.Activities.Content.CompanyAdding{
        company_id: Ecto.UUID.generate(),
        company: nil
      }

      serialized = Serializer.serialize(content_struct, level: :essential)

      assert serialized.__typename == "activity_content_company_adding"
    end
  end
end
