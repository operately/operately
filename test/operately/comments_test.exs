defmodule Operately.CommentsTest do
  use Operately.DataCase

  alias Operately.Comments

  describe "milestone_comments" do
    alias Operately.Comments.MilestoneComment

    import Operately.CompaniesFixtures
    import Operately.PeopleFixtures
    import Operately.GroupsFixtures
    import Operately.ProjectsFixtures

    setup do
      company = company_fixture()
      person = person_fixture(company_id: company.id)
      group = group_fixture(person, %{company_id: company.id})
      project = project_fixture(company_id: company.id, creator_id: person.id, group_id: group.id)
      milestone = milestone_fixture(person, %{project_id: project.id, title: "Create a milestone"})

      comment_attrs = %{
        author_id: person.id,
        content: %{
          "message" => Operately.UpdatesFixtures.rich_text_fixture("hello world")
        }
      }

      {:ok, milestone_comment} = Operately.Comments.create_milestone_comment(
        person,
        milestone,
        "none",
        comment_attrs
      )

      {:ok, milestone_comment: milestone_comment}
    end

    test "list_milestone_comments/0 returns all milestone_comments", ctx do
      assert Comments.list_milestone_comments() == [ctx.milestone_comment]
    end

    test "get_milestone_comment!/1 returns the milestone_comment with given id", ctx do
      assert Comments.get_milestone_comment!(ctx.milestone_comment.id) == ctx.milestone_comment
    end

    test "update_milestone_comment/2 with valid data updates the milestone_comment", ctx do
      update_attrs = %{action: :complete}
      assert {:ok, %MilestoneComment{} = milestone_comment} = Comments.update_milestone_comment(ctx.milestone_comment, update_attrs)
      assert milestone_comment.action == :complete
    end

    test "update_milestone_comment/2 with invalid data returns error changeset", ctx do
      update_attrs = %{action: nil}

      assert {:error, %Ecto.Changeset{}} = Comments.update_milestone_comment(ctx.milestone_comment, update_attrs)
      assert ctx.milestone_comment == Comments.get_milestone_comment!(ctx.milestone_comment.id)
    end

    test "delete_milestone_comment/1 deletes the milestone_comment", ctx do
      assert {:ok, %MilestoneComment{}} = Comments.delete_milestone_comment(ctx.milestone_comment)
      assert_raise Ecto.NoResultsError, fn -> Comments.get_milestone_comment!(ctx.milestone_comment.id) end
    end

    test "change_milestone_comment/1 returns a milestone_comment changeset", ctx do
      assert %Ecto.Changeset{} = Comments.change_milestone_comment(ctx.milestone_comment)
    end
  end
end
