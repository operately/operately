defmodule Operately.AccessBindingsTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Binding

  import Operately.AccessFixtures

  describe "access_bindings" do
    @invalid_attrs %{access_level: 11}

    setup do
      context = context_fixture()
      group = group_fixture()

      {:ok, %{context: context, group: group}}
    end

    test "list_bindings/0 returns all bindings", ctx do
      binding = binding_fixture(%{
        group_id: ctx.group.id,
        context_id: ctx.context.id,
      })

      assert Access.list_bindings() == [binding]
    end

    test "get_binding!/1 returns the binding with given id", ctx do
      binding = binding_fixture(%{
        group_id: ctx.group.id,
        context_id: ctx.context.id,
      })

      assert Access.get_binding!(binding.id) == binding
    end

    test "create_binding/1 with valid data creates a binding", ctx do
      valid_attrs = %{
        group_id: ctx.group.id,
        context_id: ctx.context.id,
        access_level: 70,
      }

      assert {:ok, %Binding{} = binding} = Access.create_binding(valid_attrs)
      assert binding.access_level == 70
    end

    test "create_binding/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Access.create_binding(@invalid_attrs)
    end

    test "update_binding/2 with valid data updates the binding", ctx do
      binding = binding_fixture(%{
        group_id: ctx.group.id,
        context_id: ctx.context.id,
      })
      update_attrs = %{access_level: 100}

      assert {:ok, %Binding{} = binding} = Access.update_binding(binding, update_attrs)
      assert binding.access_level == 100
    end

    test "update_binding/2 with invalid data returns error changeset", ctx do
      binding = binding_fixture(%{
        group_id: ctx.group.id,
        context_id: ctx.context.id,
      })
      assert {:error, %Ecto.Changeset{}} = Access.update_binding(binding, @invalid_attrs)
      assert binding == Access.get_binding!(binding.id)
    end

    test "delete_binding/1 deletes the binding", ctx do
      binding = binding_fixture(%{
        group_id: ctx.group.id,
        context_id: ctx.context.id,
      })
      assert {:ok, %Binding{}} = Access.delete_binding(binding)
      assert_raise Ecto.NoResultsError, fn -> Access.get_binding!(binding.id) end
    end

    test "change_binding/1 returns a binding changeset", ctx do
      binding = binding_fixture(%{
        group_id: ctx.group.id,
        context_id: ctx.context.id,
      })

      assert %Ecto.Changeset{} = Access.change_binding(binding)
    end
  end
end
