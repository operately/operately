defmodule Operately.Tasks.TaskTest do
  use Operately.DataCase

  alias Operately.Access.Binding
  alias Operately.Support.Factory
  alias Operately.Tasks.Task

  setup do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space, company_permissions: Binding.no_access())
      |> Factory.add_space_member(:space_viewer, :space, permissions: :view_access)
      |> Factory.add_company_member(:outsider)
      |> Factory.add_project(:project, :space,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )
      |> Factory.add_project_contributor(:project_editor, :project, :as_person)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:project_task, :milestone)
      |> Factory.create_space_task(:space_task, :space)

    {:ok, ctx}
  end

  test "authorizes project tasks through their project", ctx do
    assert {:ok, task} = Task.get(ctx.project_editor, id: ctx.project_task.id)
    assert task.id == ctx.project_task.id
    assert task.request_info.access_level == Binding.edit_access()

    assert {:error, :not_found} = Task.get(ctx.space_viewer, id: ctx.project_task.id)
    assert {:error, :not_found} = Task.get(ctx.outsider, id: ctx.project_task.id)
  end

  test "authorizes space tasks through their space", ctx do
    assert {:ok, task} = Task.get(ctx.space_viewer.id, id: ctx.space_task.id)
    assert task.id == ctx.space_task.id
    assert task.request_info.requester.id == ctx.space_viewer.id
    assert task.request_info.access_level == Binding.view_access()

    assert {:error, :not_found} = Task.get(ctx.project_editor, id: ctx.space_task.id)
    assert {:error, :not_found} = Task.get(ctx.outsider, id: ctx.space_task.id)
  end

  test "honors the required access level for every task parent", ctx do
    assert {:ok, _task} =
             Task.get(ctx.project_editor,
               id: ctx.project_task.id,
               opts: [required_access_level: Binding.edit_access()]
             )

    assert {:error, :not_found} =
             Task.get(ctx.space_viewer,
               id: ctx.space_task.id,
               opts: [required_access_level: Binding.edit_access()]
             )
  end

  test "system requests, get!, and preloads retain the standard Getter behavior", ctx do
    task = Task.get!(:system, id: ctx.project_task.id, opts: [preload: [:project, :space]])

    assert task.id == ctx.project_task.id
    assert task.project.id == ctx.project.id
    assert task.space == nil
    assert task.request_info.is_system_request

    assert_raise Ecto.NoResultsError, fn ->
      Task.get!(ctx.outsider, id: ctx.project_task.id)
    end
  end

  test "loads canonical requester information for struct requesters", ctx do
    modified_requester = %{ctx.project_editor | full_name: "Not persisted"}

    assert {:ok, task} = Task.get(modified_requester, id: ctx.project_task.id)
    assert task.request_info.requester.full_name == ctx.project_editor.full_name
  end

  test "rejects tasks owned by project templates for people and system requests", ctx do
    ctx.project
    |> Operately.Projects.Project.template_changeset(%{})
    |> Repo.update!()

    assert {:error, :not_found} = Task.get(ctx.project_editor, id: ctx.project_task.id)
    assert {:error, :not_found} = Task.get(:system, id: ctx.project_task.id)
  end
end
