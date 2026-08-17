defmodule Operately.Repo.GetterTest do
  use Operately.DataCase

  alias Operately.Access.Binding
  alias Operately.Goals.Goal
  alias Operately.Projects.Milestone
  alias Operately.Projects.Project
  alias Operately.Repo.Getter.Profile
  alias Operately.Support.Factory

  defmodule ProfiledProject do
    use Operately.Schema
    use Operately.Repo.Getter
    import Ecto.Query, only: [where: 3]

    schema "projects" do
      field :name, :string
      belongs_to :group, Operately.Groups.Group

      has_one :project_access_context, Operately.Access.Context, foreign_key: :project_id
      has_one :space_access_context, through: [:group, :access_context]

      request_info()
    end

    def getter_profile(:default) do
      %Profile{scope: &scope_regular_projects/1, access_contexts: [:project_access_context]}
    end

    def getter_profile(:template) do
      %Profile{scope: &scope_template_projects/1, access_contexts: [:space_access_context]}
    end

    def getter_profile(:all_access_paths) do
      %Profile{access_contexts: [:project_access_context, :space_access_context]}
    end

    def getter_profile(_), do: nil

    defp scope_regular_projects(query) do
      where(query, [resource: project], project.name == "Regular project")
    end

    defp scope_template_projects(query) do
      where(query, [resource: project], project.name == "Template project")
    end
  end

  defmodule InvalidProfileProject do
    use Operately.Schema
    use Operately.Repo.Getter

    schema "projects" do
      field :name, :string
      belongs_to :group, Operately.Groups.Group
      request_info()
    end

    def getter_profile(:invalid_scope), do: %Profile{scope: :not_a_function}
    def getter_profile(:missing_association), do: %Profile{access_contexts: [:missing]}
    def getter_profile(:wrong_association), do: %Profile{access_contexts: [:group]}
    def getter_profile(_), do: nil
  end

  setup do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_goal(:restricted_goal, :space, company_access: Binding.no_access(), space_access: Binding.no_access())
      |> Factory.add_project(:restricted_project, :space,
        goal: :restricted_goal,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )
      |> Factory.add_project_contributor(:viewer, :restricted_project, :as_person)
      |> Factory.add_goal(:open_goal, :space, company_access: Binding.view_access(), space_access: Binding.no_access())
      |> Factory.add_project(:open_project, :space,
        goal: :open_goal,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )
      |> Factory.add_project(:closed_project, :space,
        goal: :open_goal,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )
      |> Factory.add_project_milestone(:restricted_milestone, :restricted_project)

    ctx = Factory.add_project_contributor(ctx, :viewer_on_open_project, :open_project, viewer_on_open_project: ctx.viewer)

    {:ok, ctx}
  end

  test "auth_preload filters a single association", ctx do
    # Viewer has no access to the project, so the goal is not loaded
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal]]
             )

    assert project.goal == nil

    # Creator has access to the project, so the goal is loaded
    assert {:ok, project} =
             Project.get(ctx.creator,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal]]
             )

    assert project.goal.id == ctx.restricted_goal.id
  end

  test "auth_preload filters only listed associations when combined with preload", ctx do
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal], preload: [:group]]
             )

    assert project.goal == nil
    assert project.group.id == ctx.space.id
  end

  test "preload works regardless of access levels", ctx do
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [preload: [:goal, :group]]
             )

    assert project.goal.id == ctx.restricted_goal.id
    assert project.group.id == ctx.space.id
  end

  test "auth_preload overrides preload for the same association", ctx do
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [preload: [:goal], auth_preload: [:goal]]
             )

    assert project.goal == nil
  end

  test "auth_preload merges duplicate associations with nested preloads (goal)", ctx do
    assert {:ok, project} =
             Project.get(ctx.creator,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal, goal: [:champion]]]
             )

    assert project.goal.id == ctx.restricted_goal.id
    assert project.goal.champion.id == ctx.creator.id
  end

  test "auth_preload merges duplicate associations with nested preloads (group)", ctx do
    assert {:ok, project} =
             Project.get(ctx.creator,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:group, group: [:members]]]
             )

    assert project.group.id == ctx.space.id
    assert Enum.any?(project.group.members, &(&1.id == ctx.creator.id))
  end

  test "auth_preload filters multiple associations", ctx do
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal, :group]]
             )

    assert project.goal == nil
    assert project.group == nil
  end

  test "auth_preload works with normal preloads in the same query", ctx do
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal, :group], preload: [contributors: :person]]
             )

    assert project.goal == nil
    assert project.group == nil
    assert Enum.any?(project.contributors, &(&1.person_id == ctx.viewer.id))
  end

  test "auth_preload loads associations when requester has access", ctx do
    assert {:ok, project} =
             Project.get(ctx.creator,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal, :group]]
             )

    assert project.goal.id == ctx.restricted_goal.id
    assert project.group.id == ctx.space.id
  end

  test "auth_preload behaves like preload for system requester", ctx do
    assert {:ok, project} =
             Project.get(:system,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal, :group]]
             )

    assert project.goal.id == ctx.restricted_goal.id
    assert project.group.id == ctx.space.id
  end

  test "auth_preload filters has_many associations", ctx do
    assert {:ok, goal} =
             Goal.get(ctx.viewer,
               id: ctx.open_goal.id,
               opts: [auth_preload: [:projects]]
             )

    project_ids = Enum.map(goal.projects, & &1.id)

    assert ctx.open_project.id in project_ids
    refute ctx.closed_project.id in project_ids
  end

  test "auth_preload supports has_through associations", ctx do
    assert {:ok, milestone} =
             Milestone.get(ctx.viewer,
               id: ctx.restricted_milestone.id,
               opts: [auth_preload: [:space]]
             )

    assert milestone.space == nil

    assert {:ok, milestone} =
             Milestone.get(ctx.creator,
               id: ctx.restricted_milestone.id,
               opts: [auth_preload: [:space]]
             )

    assert milestone.space.id == ctx.space.id
  end

  describe "list" do
    test "returns visible resources with requester info and applies collection hooks", ctx do
      projects =
        Project.list(ctx.viewer,
          opts: [
            preload: [:group],
            auth_preload: [:goal],
            after_load: [fn project -> %{project | permissions: %{loaded: true}} end],
            order_by: [asc: :name]
          ]
        )

      project_ids = Enum.map(projects, & &1.id)

      assert ctx.restricted_project.id in project_ids
      assert ctx.open_project.id in project_ids
      refute ctx.closed_project.id in project_ids
      assert Enum.map(projects, & &1.name) == Enum.sort(Enum.map(projects, & &1.name))
      assert Enum.all?(projects, &(&1.request_info.requester.id == ctx.viewer.id))
      assert Enum.all?(projects, &(&1.permissions == %{loaded: true}))
      assert Enum.all?(projects, &(&1.group.id == ctx.space.id))

      restricted_project = Enum.find(projects, &(&1.id == ctx.restricted_project.id))
      open_project = Enum.find(projects, &(&1.id == ctx.open_project.id))

      assert restricted_project.goal == nil
      assert open_project.goal.id == ctx.open_goal.id
    end

    test "returns an empty list when no resources match", ctx do
      assert [] = Project.list(ctx.viewer, id: Ecto.UUID.generate())
    end

    test "attaches full access for system requests", ctx do
      [project] = Project.list(:system, id: ctx.restricted_project.id)

      assert project.request_info.requester == :system
      assert project.request_info.access_level == Binding.full_access()
      assert project.request_info.is_system_request
    end

    test "auth preloads associations for system requests", ctx do
      [project] =
        Project.list(:system,
          id: ctx.restricted_project.id,
          opts: [auth_preload: [:goal, :group]]
        )

      assert project.goal.id == ctx.restricted_goal.id
      assert project.group.id == ctx.space.id
    end

    test "includes soft-deleted resources only when requested", ctx do
      Repo.soft_delete!(ctx.restricted_project)

      assert [] = Project.list(:system, id: ctx.restricted_project.id)
      assert [] = Project.list(ctx.viewer, id: ctx.restricted_project.id)

      assert [system_project] =
               Project.list(:system,
                 id: ctx.restricted_project.id,
                 opts: [with_deleted: true]
               )

      assert [viewer_project] =
               Project.list(ctx.viewer,
                 id: ctx.restricted_project.id,
                 opts: [with_deleted: true]
               )

      assert system_project.id == ctx.restricted_project.id
      assert viewer_project.id == ctx.restricted_project.id
    end

    test "rejects ordering by unknown fields" do
      assert_raise ArgumentError, ~r/Invalid order_by.*:unknown/, fn ->
        Project.list(:system, opts: [order_by: [asc: :unknown]])
      end
    end
  end

  describe "getter profiles" do
    setup do
      ctx =
        Factory.setup(%{})
        |> Factory.add_space(:profile_space, company_permissions: Binding.no_access())
        |> Factory.add_space_member(:space_viewer, :profile_space, permissions: :view_access)
        |> Factory.add_space_member(:multi_path_user, :profile_space, permissions: :view_access)
        |> Factory.add_project(:regular_project, :profile_space,
          name: "Regular project",
          company_access_level: Binding.no_access(),
          space_access_level: Binding.no_access()
        )
        |> Factory.add_project_contributor(:project_editor, :regular_project, :as_person)

      ctx =
        Factory.add_project_contributor(ctx, :multi_path_contributor, :regular_project,
          multi_path_contributor: ctx.multi_path_user,
          permissions: :edit_access
        )

      ctx =
        ctx
        |> Factory.add_project(:template_project, :profile_space,
          name: "Template project",
          company_access_level: Binding.no_access(),
          space_access_level: Binding.no_access()
        )

      {:ok, ctx}
    end

    test "uses the default profile's scope and access context", ctx do
      assert {:ok, project} = ProfiledProject.get(ctx.project_editor, id: ctx.regular_project.id)
      assert project.id == ctx.regular_project.id
      assert project.request_info.requester.id == ctx.project_editor.id
      assert project.request_info.access_level == Binding.edit_access()

      assert {:error, :not_found} = ProfiledProject.get(ctx.space_viewer, id: ctx.regular_project.id)
      assert {:error, :not_found} = ProfiledProject.get(ctx.project_editor, id: ctx.template_project.id)
    end

    test "allows a named profile to replace both scope and access context", ctx do
      assert {:ok, project} =
               ProfiledProject.get(ctx.space_viewer,
                 id: ctx.template_project.id,
                 opts: [getter_profile: :template]
               )

      assert project.id == ctx.template_project.id
      assert project.request_info.access_level == Binding.view_access()

      assert {:error, :not_found} =
               ProfiledProject.get(ctx.project_editor,
                 id: ctx.template_project.id,
                 opts: [getter_profile: :template]
               )
    end

    test "applies profile scopes to system requests", ctx do
      assert {:ok, project} = ProfiledProject.get(:system, id: ctx.regular_project.id)
      assert project.id == ctx.regular_project.id

      assert {:error, :not_found} = ProfiledProject.get(:system, id: ctx.template_project.id)

      assert {:ok, project} =
               ProfiledProject.get(:system,
                 id: ctx.template_project.id,
                 opts: [getter_profile: :template]
               )

      assert project.id == ctx.template_project.id
    end

    test "uses the highest access level from every declared access path", ctx do
      assert {:ok, project} =
               ProfiledProject.get(ctx.multi_path_user.id,
                 id: ctx.regular_project.id,
                 opts: [getter_profile: :all_access_paths, required_access_level: Binding.edit_access()]
               )

      assert project.request_info.requester.id == ctx.multi_path_user.id
      assert project.request_info.access_level == Binding.edit_access()

      assert {:error, :not_found} =
               ProfiledProject.get(ctx.space_viewer,
                 id: ctx.regular_project.id,
                 opts: [getter_profile: :all_access_paths, required_access_level: Binding.edit_access()]
               )
    end

    test "lists resources with the highest access level from every declared access path", ctx do
      projects =
        ProfiledProject.list(ctx.multi_path_user,
          opts: [getter_profile: :all_access_paths, order_by: [asc: :name]]
        )

      access_levels = Map.new(projects, &{&1.id, &1.request_info.access_level})

      assert access_levels == %{
               ctx.regular_project.id => Binding.edit_access(),
               ctx.template_project.id => Binding.view_access()
             }

      assert [project] =
               ProfiledProject.list(ctx.multi_path_user,
                 opts: [getter_profile: :all_access_paths, required_access_level: Binding.edit_access()]
               )

      assert project.id == ctx.regular_project.id
    end

    test "applies profile scopes to system list requests", ctx do
      assert [project] = ProfiledProject.list(:system, opts: [getter_profile: :template])
      assert project.id == ctx.template_project.id
    end

    test "resources without getter_profile/1 keep the default getter behavior", ctx do
      assert {:ok, project} = Project.get(ctx.project_editor, id: ctx.regular_project.id)
      assert project.id == ctx.regular_project.id
      assert project.request_info.access_level == Binding.edit_access()
    end

    test "rejects unknown and malformed profiles with diagnostic errors", ctx do
      assert_raise ArgumentError, ~r/Unknown getter profile :unknown for .*ProfiledProject/, fn ->
        ProfiledProject.get(:system, id: ctx.regular_project.id, opts: [getter_profile: :unknown])
      end

      assert_raise ArgumentError, ~r/profile :invalid_scope.*scope must be nil or a function with arity 1/, fn ->
        InvalidProfileProject.get(:system, id: ctx.regular_project.id, opts: [getter_profile: :invalid_scope])
      end

      assert_raise ArgumentError, ~r/profile :missing_association.*unknown access context association :missing/, fn ->
        InvalidProfileProject.get(:system, id: ctx.regular_project.id, opts: [getter_profile: :missing_association])
      end

      assert_raise ArgumentError, ~r/profile :wrong_association.*must resolve to Operately.Access.Context/, fn ->
        InvalidProfileProject.get(:system, id: ctx.regular_project.id, opts: [getter_profile: :wrong_association])
      end
    end
  end
end
