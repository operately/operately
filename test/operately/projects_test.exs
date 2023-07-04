defmodule Operately.ProjectsTest do
  use Operately.DataCase

  alias Operately.Projects

  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  setup do
    company = company_fixture()
    person = person_fixture(%{company_id: company.id})

    project = project_fixture(%{
      company_id: company.id,
      creator_id: person.id
    })

    {:ok, company: company, project: project, person: person}
  end

  describe "projects" do
    alias Operately.Projects.Project

    import Operately.ProjectsFixtures

    @invalid_attrs %{description: nil, name: nil}

    test "list_projects/0 returns all projects", ctx do
      assert Projects.list_projects() == [ctx.project]
    end

    test "get_project!/1 returns the project with given id", ctx do
      assert Projects.get_project!(ctx.project.id) == ctx.project
    end

    test "create_project/2 with valid data creates a project", ctx do
      project_attrs = %{
        name: "some name",
        company_id: ctx.company.id,
        creator_id: ctx.person.id
      }

      champion_attrs = %{
        person_id: ctx.person.id,
        role: "champion",
      }

      assert {:ok, %Project{} = project} = Projects.create_project(project_attrs, champion_attrs)
      assert project.name == "some name"
    end

    test "create_project/2 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_project(@invalid_attrs)
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

    test "delete_project/1 deletes the project", ctx do
      assert {:ok, %Project{}} = Projects.delete_project(ctx.project)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_project!(ctx.project.id) end
    end

    test "change_project/1 returns a project changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_project(ctx.project)
    end
  end

  describe "project_milestones" do
    alias Operately.Projects.Milestone

    import Operately.ProjectsFixtures

    @invalid_attrs %{deadline_at: nil, title: nil}

    setup ctx do
      # Projects are automatically assigned some milestones. I clean them up here
      # so that I can test the create_milestone/1 function
      Operately.Repo.delete_all(Milestone)

      milestone = milestone_fixture(ctx.person, %{project_id: ctx.project.id})

      {:ok, milestone: milestone}
    end

    test "list_project_milestones/1 returns all project_milestones", ctx do
      assert Projects.list_project_milestones(ctx.project) == [ctx.milestone]
    end

    test "get_milestone!/1 returns the milestone with given id", ctx do
      assert Projects.get_milestone!(ctx.milestone.id) == ctx.milestone
    end

    test "create_milestone/1 with valid data creates a milestone", ctx do
      valid_attrs = %{
        project_id: ctx.project.id,
        deadline_at: ~N[2023-05-10 08:16:00], 
        title: "some title"
      }

      assert {:ok, %Milestone{} = milestone} = Projects.create_milestone(ctx.person, valid_attrs)
      assert milestone.deadline_at == ~N[2023-05-10 08:16:00]
      assert milestone.title == "some title"
    end

    test "create_milestone/1 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Projects.create_milestone(ctx.person, @invalid_attrs)
    end

    test "update_milestone/2 with valid data updates the milestone", ctx do
      update_attrs = %{deadline_at: ~N[2023-05-11 08:16:00], title: "some updated title"}

      assert {:ok, %Milestone{} = milestone} = Projects.update_milestone(ctx.milestone, update_attrs)
      assert milestone.deadline_at == ~N[2023-05-11 08:16:00]
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
      contributor = contributor_fixture(%{
        project_id: ctx.project.id,
        person_id: ctx.person.id
      })

      {:ok, contributor: contributor}
    end

    test "list_project_contributors/0 returns all project_contributors", ctx do
      assert Projects.list_project_contributors(ctx.project) == [ctx.contributor]
    end

    test "get_contributor!/1 returns the contributor with given id", ctx do
      assert Projects.get_contributor!(ctx.contributor.id) == ctx.contributor
    end

    test "create_contributor/1 with valid data creates a contributor", ctx do
      valid_attrs = %{
        project_id: ctx.project.id,
        person_id: ctx.person.id,
        responsibility: "some responsibility"
      }

      assert {:ok, %Contributor{} = contributor} = Projects.create_contributor(valid_attrs)
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
        author_id: ctx.person.id
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
        author_id: ctx.person.id, 
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
end
