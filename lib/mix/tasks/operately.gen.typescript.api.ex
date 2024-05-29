defmodule Mix.Tasks.Operately.Gen.Typescript.Api do
  def run(_) do
    specs = OperatelyWeb.Api.get_specs()
    content = TurboConnect.TsGen.generate(specs)

    File.write!("assets/js/api/index.tsx", content)
  end
end
