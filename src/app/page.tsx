const applications = [
  {
    id: 1,
    companyName: "サンプル株式会社",
    position: "Webエンジニア",
    status: "応募済み",
    deadline: "2026-07-31",
  },
  {
    id: 2,
    companyName: "テストテクノロジー株式会社",
    position: "フロントエンドエンジニア",
    status: "検討中",
    deadline: "未設定",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            Job Hunting Manager
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            JobTrack
          </h1>

          <p className="mt-2 text-slate-600">
            応募企業と選考状況をまとめて管理します。
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            応募企業
          </h2>

          <div className="grid gap-4">
            {applications.map((application) => (
              <article
                key={application.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {application.companyName}
                    </h3>

                    <p className="mt-1 text-slate-600">
                      {application.position}
                    </p>
                  </div>

                  <div className="text-sm text-slate-600">
                    <p>状況：{application.status}</p>
                    <p className="mt-1">
                      締切：{application.deadline}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}