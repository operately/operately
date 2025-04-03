defmodule OperatelyWeb.Api.Queries.GetProjectRetrospectiveTest do
  use OperatelyWeb.TurboCase

  import Operately.NotificationsFixtures
  import Operately.ActivitiesFixtures

  alias Operately.Projects.Retrospective

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_project_retrospective, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:company_member)
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:space_member, :space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_contributor(:contributor, :project)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)
    end

    test "company members", ctx do
      ctx = log_in_account(ctx, ctx.company_member)

      ctx = Factory.edit_project_company_members_access(ctx, :project, :no_access)
      assert {404, _} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_company_members_access(ctx, :project, :view_access)
      assert {200, _} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_company_members_access(ctx, :project, :edit_access)
      assert {200, _} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_company_members_access(ctx, :project, :full_access)
      assert {200, _} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})
    end

    test "space members", ctx do
      ctx = log_in_account(ctx, ctx.space_member)

      ctx = Factory.edit_project_company_members_access(ctx, :project, :no_access)

      ctx = Factory.edit_project_space_members_access(ctx, :project, :no_access)
      assert {404, _} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_space_members_access(ctx, :project, :view_access)
      assert {200, _} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_space_members_access(ctx, :project, :edit_access)
      assert {200, _} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_space_members_access(ctx, :project, :full_access)
      assert {200, _} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})
    end

    test "project contributors", ctx do
      ctx = log_in_account(ctx, Operately.People.get_person!(ctx.contributor.person_id))

      ctx = Factory.edit_project_company_members_access(ctx, :project, :no_access)
      ctx = Factory.edit_project_space_members_access(ctx, :project, :no_access)

      assert {200, _} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})
    end
  end


  describe "get_project_retrospective functionality" do
    setup :register_and_log_in_account

    setup ctx do
      ctx
      |> Factory.add_company_member(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)
    end

    test "get a project retrospective with nothing included", ctx do
      assert {200, res} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})

      {:ok, retrospective} = Retrospective.get(:system, id: ctx.retrospective.id)

      assert res.retrospective == Serializer.serialize(retrospective)
    end

    test "include_unread_notifications", ctx do
      a = activity_fixture(author_id: ctx.creator.id, action: "project_closed", content: %{retrospective_id: ctx.retrospective.id})
      n = notification_fixture(person_id: ctx.person.id, read: false, activity_id: a.id)

      assert {200, res} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})
      assert res.retrospective.notifications == []

      assert {200, res} = query(ctx.conn, :get_project_retrospective, %{
        project_id: Paths.project_id(ctx.project),
        include_unread_notifications: true,
      })

      assert length(res.retrospective.notifications) == 1
      assert Serializer.serialize(n) == hd(res.retrospective.notifications)
    end

    test "include_author", ctx do
      assert {200, res} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})

      refute res.retrospective.author

      assert {200, res} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project), include_author: true})

      assert res.retrospective.author == Serializer.serialize(ctx.creator)
    end

    test "include_project", ctx do
       assert {200, res} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project)})

      refute res.retrospective.project

      assert {200, res} = query(ctx.conn, :get_project_retrospective, %{project_id: Paths.project_id(ctx.project), include_project: true})

      assert res.retrospective.project == Serializer.serialize(ctx.project)
    end

    test "include_permissions", ctx do
      assert {200, res} = query(ctx.conn, :get_project_retrospective, %{
        project_id: Paths.project_id(ctx.project),
      })

      refute res.retrospective.permissions

      assert {200, res} = query(ctx.conn, :get_project_retrospective, %{
        project_id: Paths.project_id(ctx.project),
        include_permissions: true,
      })

      assert res.retrospective.permissions
    end

    test "include_potential_subscribers", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:contrib1, :project, :as_person)
        |> Factory.add_project_contributor(:contrib2, :project, :as_person)

      assert {200, res} = query(ctx.conn, :get_project_retrospective, %{
        project_id: Paths.project_id(ctx.project),
      })

      refute res.retrospective.potential_subscribers

      assert {200, res} = query(ctx.conn, :get_project_retrospective, %{
        project_id: Paths.project_id(ctx.project),
        include_potential_subscribers: true,
      })

      subs = res.retrospective.potential_subscribers

      assert Enum.find(subs, &(&1.person.id == Paths.person_id(ctx.contrib1)))
      assert Enum.find(subs, &(&1.person.id == Paths.person_id(ctx.contrib2)))
    end
  end
end
