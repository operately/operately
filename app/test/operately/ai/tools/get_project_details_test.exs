defmodule Operately.AI.Tools.GetProjectDetailsTest do
  use Operately.DataCase

  alias Operately.AI.Tools
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})
    |> Factory.add_space(:product)
  end

  describe "get_project_details/0" do
    setup ctx do
      Factory.add_project(ctx, :project, :product)
    end

    test "returns project details when project_id is in context", ctx do
      tool = Tools.get_project_details()
      project_id = OperatelyWeb.Api.Helpers.encode_id(ctx.project.id)
      context = %{person: ctx.creator, project_id: project_id}
      args = %{}

      assert {:ok, result} = tool.function.(args, context)
      assert result =~ ctx.project.name
      assert is_binary(result)
    end

    test "returns error when project_id is missing from context", ctx do
      tool = Tools.get_project_details()
      context = %{person: ctx.creator}
      args = %{}

      assert {:error, error_msg} = tool.function.(args, context)
      assert error_msg =~ "No project associated with this conversation"
    end

    test "returns error when project is not accessible", ctx do
      # Create another company and person to test access permissions
      other_ctx = Factory.setup(%{})
      |> Factory.add_space(:other_space)
      |> Factory.add_project(:other_project, :other_space)

      tool = Tools.get_project_details()
      project_id = OperatelyWeb.Api.Helpers.encode_id(other_ctx.other_project.id)
      context = %{person: ctx.creator, project_id: project_id}
      args = %{}

      assert {:error, error_msg} = tool.function.(args, context)
      assert error_msg =~ "Unable to access project"
    end

    test "returns error when project_id format is invalid", ctx do
      tool = Tools.get_project_details()
      context = %{person: ctx.creator, project_id: "invalid-id"}
      args = %{}

      assert {:error, error_msg} = tool.function.(args, context)
      assert error_msg =~ "Invalid project ID"
    end
  end
end