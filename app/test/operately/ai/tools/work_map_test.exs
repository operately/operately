defmodule Operately.AI.Tools.WorkMapTest do
  use Operately.DataCase

  alias Operately.AI.Tools
  alias Operately.Support.Factory

  setup do
    ctx = Factory.setup(%{}) |> Factory.add_space(:product)

    {:ok, company} = Operately.Demo.run(ctx.account, "Acme Inc.", "CEO")

    ctx = Map.put(ctx, :creator, Operately.People.get_person!(ctx.account, company))
    ctx = Map.put(ctx, :company, company)

    ctx
  end

  test "returns the work map for a company", ctx do
    tool = Tools.work_map()
    context = %{person: ctx.creator}

    assert {:ok, result} = tool.function.(%{}, context)
    IO.puts(result)
  end
end
