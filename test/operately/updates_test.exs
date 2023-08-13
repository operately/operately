defmodule Operately.UpdatesTest do
  use Operately.DataCase

  alias Operately.Updates

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  setup do
    company = company_fixture()
    person = person_fixture(company_id: company.id)

    {:ok, %{company: company, person: person}}
  end

  describe "updates" do
    alias Operately.Updates.Update

    import Operately.UpdatesFixtures

    @invalid_attrs %{content: nil, updatable_id: nil, updatable_type: nil}

    setup ctx do
      update = update_fixture(%{author_id: ctx.person.id})

      {:ok, %{update: update}}
    end

    test "list_updates/0 returns all updates", ctx do
      assert Updates.list_updates() |> Enum.map(& &1.id) == [ctx.update.id]
    end

    test "get_update!/1 returns the update with given id", ctx do
      assert Updates.get_update!(ctx.update.id).id == ctx.update.id
    end

    test "create_update/1 with valid data creates a update", ctx do
      valid_attrs = %{
        content: %{
          "message" => %{},
        },
        type: :status_update,
        updatable_id: "7488a646-e31f-11e4-aace-600308960662",
        updatable_type: :objective,
        author_id: ctx.person.id
      }

      assert {:ok, %Update{} = update} = Updates.create_update(valid_attrs)
      assert update.updatable_id == "7488a646-e31f-11e4-aace-600308960662"
      assert update.updatable_type == :objective
    end

    test "create_update/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Updates.create_update(@invalid_attrs)
    end

    test "update_update/2 with valid data updates the update", ctx do
      update_attrs = %{updatable_id: "7488a646-e31f-11e4-aace-600308960668", updatable_type: :project}

      assert {:ok, %Update{} = update} = Updates.update_update(ctx.update, update_attrs)
      assert update.updatable_id == "7488a646-e31f-11e4-aace-600308960668"
      assert update.updatable_type == :project
    end

    test "update_update/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Updates.update_update(ctx.update, @invalid_attrs)
    end

    test "delete_update/1 deletes the update", ctx do
      assert {:ok, %Update{}} = Updates.delete_update(ctx.update)
      assert_raise Ecto.NoResultsError, fn -> Updates.get_update!(ctx.update.id) end
    end

    test "change_update/1 returns a update changeset", ctx do
      assert %Ecto.Changeset{} = Updates.change_update(ctx.update)
    end
  end

  describe "comments" do
    alias Operately.Updates.Comment

    import Operately.UpdatesFixtures

    @invalid_attrs %{content: nil}

    setup ctx do
      update = update_fixture(%{author_id: ctx.person.id})
      comment = comment_fixture(update, %{author_id: ctx.person.id, update_id: update.id})

      {:ok, %{update: update, comment: comment}}
    end

    test "list_comments/0 returns all comments", ctx do
      assert Updates.list_comments(ctx.update.id) == [ctx.comment]
    end

    test "get_comment!/1 returns the comment with given id", ctx do
      assert Updates.get_comment!(ctx.comment.id) == ctx.comment
    end

    test "create_comment/1 with valid data creates a comment", ctx do
      valid_attrs = %{
        content: %{message: %{}},
        author_id: ctx.person.id,
        update_id: ctx.update.id
      }

      assert {:ok, %Comment{} = comment} = Updates.create_comment(ctx.update, valid_attrs)
      assert comment.content == %{message: %{}}
    end

    test "create_comment/1 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Updates.create_comment(ctx.update, @invalid_attrs)
    end

    test "update_comment/2 with valid data updates the comment", ctx do
      update_attrs = %{content: %{
        "message" => %{},
      }}

      assert {:ok, %Comment{} = comment} = Updates.update_comment(ctx.comment, update_attrs)
      assert comment.content == %{"message" => %{}}
    end

    test "update_comment/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Updates.update_comment(ctx.comment, @invalid_attrs)
      assert ctx.comment == Updates.get_comment!(ctx.comment.id)
    end

    test "delete_comment/1 deletes the comment", ctx do
      assert {:ok, %Comment{}} = Updates.delete_comment(ctx.comment)
      assert_raise Ecto.NoResultsError, fn -> Updates.get_comment!(ctx.comment.id) end
    end

    test "change_comment/1 returns a comment changeset", ctx do
      assert %Ecto.Changeset{} = Updates.change_comment(ctx.comment)
    end
  end

  describe "reactions" do
    alias Operately.Updates.Reaction

    import Operately.UpdatesFixtures

    @invalid_attrs %{entity_id: nil, entity_type: nil, reaction_type: nil}

    test "list_reactions/2 returns all reactions" do
      reaction = reaction_fixture()
      assert Updates.list_reactions(reaction.entity_id, reaction.entity_type) == [reaction]
    end

    test "get_reaction!/1 returns the reaction with given id" do
      reaction = reaction_fixture()
      assert Updates.get_reaction!(reaction.id) == reaction
    end

    test "create_reaction/1 with valid data creates a reaction" do
      valid_attrs = %{entity_id: "7488a646-e31f-11e4-aace-600308960662", entity_type: :update, reaction_type: :thumbs_up}

      assert {:ok, %Reaction{} = reaction} = Updates.create_reaction(valid_attrs)
      assert reaction.entity_id == "7488a646-e31f-11e4-aace-600308960662"
      assert reaction.entity_type == :update
      assert reaction.reaction_type == :thumbs_up
    end

    test "create_reaction/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Updates.create_reaction(@invalid_attrs)
    end

    test "update_reaction/2 with valid data updates the reaction" do
      reaction = reaction_fixture()
      update_attrs = %{
        entity_id: "7488a646-e31f-11e4-aace-600308960668", 
        entity_type: :comment, 
        reaction_type: :thumbs_down
      }

      assert {:ok, %Reaction{} = reaction} = Updates.update_reaction(reaction, update_attrs)
      assert reaction.entity_id == "7488a646-e31f-11e4-aace-600308960668"
      assert reaction.entity_type == :comment
      assert reaction.reaction_type == :thumbs_down
    end

    test "update_reaction/2 with invalid data returns error changeset" do
      reaction = reaction_fixture()
      assert {:error, %Ecto.Changeset{}} = Updates.update_reaction(reaction, @invalid_attrs)
      assert reaction == Updates.get_reaction!(reaction.id)
    end

    test "delete_reaction/1 deletes the reaction" do
      reaction = reaction_fixture()
      assert {:ok, %Reaction{}} = Updates.delete_reaction(reaction)
      assert_raise Ecto.NoResultsError, fn -> Updates.get_reaction!(reaction.id) end
    end

    test "change_reaction/1 returns a reaction changeset" do
      reaction = reaction_fixture()
      assert %Ecto.Changeset{} = Updates.change_reaction(reaction)
    end
  end
end
