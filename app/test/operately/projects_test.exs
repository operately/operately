defmodule Operately.ProjectsTest do
  use Operately.DataCase

  alias Operately.Projects
  alias Operately.Access.Binding
  alias Operately.ContextualDates.ContextualDate

  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  setup do
    company = company_fixture()
    champion = person_fixture(%{company_id: company.id})
    reviewer = person_fixture(%{company_id: company.id})
    group = group_fixture(champion, %{company_id: company.id})

    project = project_fixture(%{
      company_id: company.id,
      creator_id: champion.id,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      group_id: group.id
    })

    {:ok, company: company, project: project, champion: champion, reviewer: reviewer, group: group}
  end

  describe "projects" do
    alias Operately.Projects.Project

    import Operately.ProjectsFixtures

    @invalid_attrs %{description: nil, name: nil}

    test "list_projects/0 returns all projects", ctx do
      assert Projects.list_projects(ctx.champion, %{}) == [ctx.project]
    end

    test "get_project!/1 returns the project with given id", ctx do
      assert Projects.get_project!(ctx.project.id) == ctx.project
    end

    test "create_project/2 with valid data creates a project", ctx do
      project_attrs = %Operately.Operations.ProjectCreation{
        name: "some name",
        company_id: ctx.company.id,
        group_id: ctx.group.id,
        champion_id: ctx.champion.id,
        reviewer_id: ctx.reviewer.id,
        creator_id: ctx.champion.id,
        company_access_level: Binding.view_access(),
        space_access_level: Binding.comment_access(),
      }

      assert {:ok, %Project{} = project} = Projects.create_project(project_attrs)
      assert project.name == "some name"

      assert nil != Operately.Access.get_context!(project_id: project.id)
    end

    test "update_project/2 with valid data updates the project", ctx do
      update_attrs = %{name: "some updated name"}

      assert {:ok, %Project{} = project} = Projects.update_project(ctx.project, update_attrs)
      assert project.name == "some updated name"
    end

    test "update_project/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Projects.update_project(ctx.project, @invalid_attrs)
      assert ctx.project == Projects.get_project!(ctx.project.id)
    end

    test "archive_project/1 archives the project", ctx do
      assert {:ok, project} = Projects.archive_project(ctx.champion, ctx.project)
      assert project.deleted_at != nil
    end

    test "change_project/1 returns a project changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_project(ctx.project)
    end

    test "outdated?/1 returns true if the project is outdated" do
      four_days_from_now = DateTime.utc_now() |> DateTime.add(4, :day)
      tomorrow =  DateTime.utc_now() |> DateTime.add(1, :day)
      yesterday = DateTime.utc_now() |> DateTime.add(-1, :day)
      four_days_ago = DateTime.utc_now() |> DateTime.add(-4, :day)
      last_week = DateTime.utc_now() |> DateTime.add(-7, :day)

      refute Projects.outdated?(%{deleted_at: nil, status: "active", next_check_in_scheduled_at: four_days_from_now})
      refute Projects.outdated?(%{deleted_at: nil, status: "active", next_check_in_scheduled_at: tomorrow})
      refute Projects.outdated?(%{deleted_at: nil, status: "active", next_check_in_scheduled_at: yesterday})
      assert Projects.outdated?(%{deleted_at: nil, status: "active", next_check_in_scheduled_at: four_days_ago})
      assert Projects.outdated?(%{deleted_at: nil, status: "active", next_check_in_scheduled_at: last_week})

      refute Projects.outdated?(%{deleted_at: nil, status: "closed", next_check_in_scheduled_at: last_week})
      refute Projects.outdated?(%{deleted_at: nil, status: "paused", next_check_in_scheduled_at: last_week})
      refute Projects.outdated?(%{deleted_at: yesterday, status: "active", next_check_in_scheduled_at: last_week})
    end
  end

  describe "project_milestones" do
    alias Operately.Projects.Milestone

    import Operately.ProjectsFixtures

    @invalid_attrs %{timeframe: nil, title: nil}

    setup ctx do
      # Projects are automatically assigned some milestones. I clean them up here
      # so that I can test the create_milestone/1 function
      Operately.Repo.delete_all(Milestone)

      milestone = milestone_fixture(%{project_id: ctx.project.id})

      {:ok, milestone: milestone}
    end

    test "list_project_milestones/1 returns all project_milestones", ctx do
      assert Projects.list_project_milestones(ctx.project) == [ctx.milestone]
    end

    test "get_milestone!/1 returns the milestone with given id", ctx do
      assert Projects.get_milestone!(ctx.milestone.id) == ctx.milestone
    end

    test "update_milestone/2 with valid data updates the milestone", ctx do
      update_attrs = %{
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(Date.utc_today()),
          contextual_end_date: ContextualDate.create_day_date(~D[2023-06-17]),
        },
        title: "some updated title"
      }

      assert {:ok, %Milestone{} = milestone} = Projects.update_milestone(ctx.milestone, update_attrs)
      assert milestone.timeframe.contextual_end_date.date == ~D[2023-06-17]
      assert milestone.title == "some updated title"
    end

    test "update_milestone/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Projects.update_milestone(ctx.milestone, @invalid_attrs)
      assert ctx.milestone == Projects.get_milestone!(ctx.milestone.id)
    end

    test "delete_milestone/1 deletes the milestone", ctx do
      assert {:ok, %Milestone{}} = Projects.delete_milestone(ctx.milestone)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_milestone!(ctx.milestone.id) end
    end

    test "change_milestone/1 returns a milestone changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_milestone(ctx.milestone)
    end
  end

  describe "project_contributors" do
    alias Operately.Projects.Contributor

    setup ctx do
      contributor = contributor_fixture(ctx.champion, %{
        project_id: ctx.project.id,
        person_id: ctx.champion.id
      })

      {:ok, contributor: contributor}
    end

    test "list_project_contributors/0 returns all project_contributors", ctx do
      assert Projects.list_project_contributors(ctx.project) |> Enum.find(fn c -> c.id == ctx.contributor.id end)
    end

    test "get_contributor!/1 returns the contributor with given id", ctx do
      assert Projects.get_contributor!(ctx.contributor.id) == ctx.contributor
    end

    test "create_contributor/2 with valid data creates a contributor", ctx do
      valid_attrs = %{
        project_id: ctx.project.id,
        person_id: ctx.champion.id,
        responsibility: "some responsibility",
        permissions: Binding.edit_access()
      }

      assert {:ok, %Contributor{} = contributor} = Projects.create_contributor(ctx.champion, valid_attrs)
      assert contributor.responsibility == "some responsibility"
    end

    test "update_contributor/2 with valid data updates the contributor", ctx do
      update_attrs = %{responsibility: "some updated responsibility"}

      assert {:ok, %Contributor{} = contributor} = Projects.update_contributor(ctx.contributor, update_attrs)
      assert contributor.responsibility == "some updated responsibility"
    end

    test "delete_contributor/1 deletes the contributor", ctx do
      assert {:ok, %Contributor{}} = Projects.delete_contributor(ctx.contributor)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_contributor!(ctx.contributor.id) end
    end

    test "change_contributor/1 returns a contributor changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_contributor(ctx.contributor)
    end
  end

  describe "project_documents" do
    alias Operately.Projects.Document

    import Operately.ProjectsFixtures

    @invalid_attrs %{content: nil, title: nil}

    setup ctx do
      document = document_fixture(%{
        project_id: ctx.project.id,
        author_id: ctx.champion.id
      })

      {:ok, document: document}
    end

    test "list_project_documents/0 returns all project_documents", ctx do
      assert Projects.list_project_documents() == [ctx.document]
    end

    test "get_document!/1 returns the document with given id", ctx do
      assert Projects.get_document!(ctx.document.id) == ctx.document
    end

    test "create_document/1 with valid data creates a document", ctx do
      valid_attrs = %{
        content: %{},
        title: "some title",
        author_id: ctx.champion.id,
        project_id: ctx.project.id
      }

      assert {:ok, %Document{} = document} = Projects.create_document(valid_attrs)
      assert document.content == %{}
      assert document.title == "some title"
    end

    test "create_document/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_document(@invalid_attrs)
    end

    test "update_document/2 with valid data updates the document", ctx do
      update_attrs = %{content: %{}, title: "some updated title"}

      assert {:ok, %Document{} = document} = Projects.update_document(ctx.document, update_attrs)
      assert document.content == %{}
      assert document.title == "some updated title"
    end

    test "update_document/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Projects.update_document(ctx.document, @invalid_attrs)
      assert ctx.document == Projects.get_document!(ctx.document.id)
    end

    test "delete_document/1 deletes the document", ctx do
      assert {:ok, %Document{}} = Projects.delete_document(ctx.document)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_document!(ctx.document.id) end
    end

    test "change_document/1 returns a document changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_document(ctx.document)
    end
  end

  describe "project_key_resources" do
    alias Operately.Projects.KeyResource

    import Operately.ProjectsFixtures

    @invalid_attrs %{link: nil, title: nil}

    setup ctx do
      key_resource = key_resource_fixture(%{project_id: ctx.project.id})

      {:ok, key_resource: key_resource}
    end

    test "list_key_resources/0 returns all project_key_resources", ctx do
      assert Projects.list_key_resources(ctx.project) == [ctx.key_resource]
    end

    test "get_key_resource!/1 returns the key_resource with given id", ctx do
      assert Projects.get_key_resource!(ctx.key_resource.id) == ctx.key_resource
    end

    test "create_key_resource/1 with valid data creates a key_resource", ctx do
      valid_attrs = %{link: "some link", title: "some title", project_id: ctx.project.id, resource_type: "slack-channel"}

      assert {:ok, %KeyResource{} = key_resource} = Projects.create_key_resource(valid_attrs)
      assert key_resource.link == "some link"
      assert key_resource.title == "some title"
      assert key_resource.project_id == ctx.project.id
      assert key_resource.resource_type == "slack-channel"
    end

    test "create_key_resource/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_key_resource(@invalid_attrs)
    end

    test "update_key_resource/2 with valid data updates the key_resource", ctx do
      update_attrs = %{link: "some updated link", title: "some updated title"}

      assert {:ok, %KeyResource{} = key_resource} = Projects.update_key_resource(ctx.key_resource, update_attrs)
      assert key_resource.link == "some updated link"
      assert key_resource.title == "some updated title"
      assert key_resource.project_id == ctx.project.id
    end

    test "update_key_resource/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Projects.update_key_resource(ctx.key_resource, @invalid_attrs)
      assert ctx.key_resource == Projects.get_key_resource!(ctx.key_resource.id)
    end

    test "delete_key_resource/1 deletes the key_resource", ctx do
      assert {:ok, %KeyResource{}} = Projects.delete_key_resource(ctx.key_resource)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_key_resource!(ctx.key_resource.id) end
    end

    test "change_key_resource/1 returns a key_resource changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_key_resource(ctx.key_resource)
    end
  end
end
