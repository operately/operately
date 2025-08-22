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

    test "returns project details when project_id parameter is provided", ctx do
      tool = Tools.get_project_details()
      context = %{person: ctx.creator}
      project_id = Operately.ShortUuid.encode!(ctx.project.id)
      args = %{"project_id" => project_id}

      assert {:ok, result} = tool.function.(args, context)
      assert result =~ ctx.project.name
      assert is_binary(result)
    end

    test "returns error when project_id parameter is missing", ctx do
      tool = Tools.get_project_details()
      context = %{person: ctx.creator}
      args = %{}

      assert {:error, error_msg} = tool.function.(args, context)
      assert error_msg =~ "Invalid project ID"
    end

    test "returns error when project_id format is invalid", ctx do
      tool = Tools.get_project_details()
      context = %{person: ctx.creator}
      args = %{"project_id" => "invalid-id"}

      assert {:error, error_msg} = tool.function.(args, context)
      assert error_msg =~ "Invalid project ID"
    end
  end
end
