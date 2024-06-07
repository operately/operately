defmodule Operately.AccessContextsTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Context

  import Operately.AccessFixtures

  describe "access_contexts" do
    test "list_contexts/0 returns all contexts" do
      context = context_fixture()
      assert Access.list_contexts() == [context]
    end

    test "get_context!/1 returns the context with given id" do
      context = context_fixture()
      assert Access.get_context!(context.id) == context
    end

    test "create_context/1 with valid data creates a context" do
      valid_attrs = %{}

      assert {:ok, %Context{} = _context} = Access.create_context(valid_attrs)
    end

    test "update_context/2 with valid data updates the context" do
      context = context_fixture()
      update_attrs = %{}

      assert {:ok, %Context{} = _context} = Access.update_context(context, update_attrs)
    end

    test "delete_context/1 deletes the context" do
      context = context_fixture()
      assert {:ok, %Context{}} = Access.delete_context(context)
      assert_raise Ecto.NoResultsError, fn -> Access.get_context!(context.id) end
    end

    test "change_context/1 returns a context changeset" do
      context = context_fixture()
      assert %Ecto.Changeset{} = Access.change_context(context)
    end
  end
end
