defmodule Mix.Tasks.TestsWithRetries do
  @limit 5

  def run(args) do
    case System.cmd("mix", ["test"] ++ args, into: IO.stream(:stdio, :line)) do
      {output, 0} ->
        output

      {output, _} ->
        IO.inspect(output)
        IO.puts("Rerunning failed tests...")
        retry(args, 0)
    end
  end

  def retry(args, count) when count <= @limit do
    case System.cmd("mix", ["test", "--failed"] ++ args, into: IO.stream(:stdio, :line)) do
      {output, 0} ->
        output

      {output, _} ->
        IO.inspect(output)
        retry(args, count + 1)
    end
  end

  def retry(_args, _count) do
    exit(1)
  end
end
