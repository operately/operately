defmodule Mix.Tasks.Operately.Gen.Typescript.Graphql.Schema do
  def run(_args) do
    Mix.Tasks.Absinthe.Schema.Sdl.run(["--schema", "OperatelyWeb.Graphql.Schema"])
    File.mkdir_p!("tmp")
    File.rename("schema.graphql", "tmp/schema.graphql")
    System.cmd("npm", ["run", "codegen"], cd: "assets")
  end
end
