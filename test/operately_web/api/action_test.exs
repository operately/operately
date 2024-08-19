defmodule OperatelyWeb.Api.ActionTest do
  use Operately.DataCase

  alias OperatelyWeb.Api.Action
  import OperatelyWeb.Api.Action, only: [run: 3]

  describe "new/0" do
    test "returns an empty context" do
      assert {:ok, %{} } == Action.new()
    end
  end

  describe "run/3" do
    test "runs the function and adds the result to the context" do
      action = Action.new()
      assert {:ok, %{key: :value}} == run(action, :key, fn -> {:ok, :value} end)
    end

    test "if the function takes a context, it passes the context to the function" do
      res = 
        Action.new()
        |> run(:key, fn -> {:ok, "Hello"} end)
        |> run(:key2, fn ctx -> {:ok, ctx.key <> " World"} end)

      assert {:ok, %{key: "Hello", key2: "Hello World"}} == res
    end

    test "if the key already exists, it raises an ArgumentError" do
      assert_raise ArgumentError, fn ->
        Action.new()
        |> run(:key, fn -> {:ok, "Hello"} end)
        |> run(:key, fn -> {:ok, "World"} end)
      end
    end

    test "if the function returns an error, it adds the error to the context" do
      res = Action.new() |> run(:key, fn -> {:error, :bad_request} end)

      assert {:error, :key, %{error: :bad_request, context: %{}}} == res
    end

    test "if one of the functions returns an error, it stops the chain" do
      res= 
        Action.new()
        |> run(:key, fn -> {:ok, "Hello"} end)
        |> run(:key2, fn -> {:error, :bad_request} end)
        |> run(:key3, fn ctx -> {:ok, ctx.key <> " World"} end)

      assert {:error, :key2, %{error: :bad_request, context: %{key: "Hello"}}} == res
    end
  end
end
