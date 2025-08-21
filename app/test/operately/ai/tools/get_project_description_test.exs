defmodule Operately.AI.Tools.GetProjectDescriptionTest do
  use Operately.DataCase

  alias Operately.AI.Tools
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})
    |> Factory.add_space(:product)
  end

  describe "get_project_description/0" do
    setup ctx do
      Factory.add_project(ctx, :project, :product)
    end

    test "returns project description when project_id is in context", ctx do
      tool = Tools.get_project_description()
      context = %{
        person: ctx.creator,
        project_id: ctx.project.id
      }
      args = %{}

      assert {:ok, result} = tool.function.(args, context)
      assert result =~ ctx.project.name
      assert is_binary(result)
    end

    test "returns error when no project context is available", ctx do
      tool = Tools.get_project_description()
      context = %{person: ctx.creator}
      args = %{}

      assert {:error, error_msg} = tool.function.(args, context)
      assert error_msg =~ "No project context available"
    end

    test "returns error when project is not accessible", ctx do
      # Create another company and person to test access permissions
      other_ctx = Factory.setup(%{})
      |> Factory.add_space(:other_space)
      |> Factory.add_project(:other_project, :other_space)

      tool = Tools.get_project_description()
      context = %{
        person: ctx.creator,
        project_id: other_ctx.other_project.id  # Try to access project from different company
      }
      args = %{}

      assert {:error, error_msg} = tool.function.(args, context)
      assert error_msg =~ "Unable to access project"
    end
  end
end